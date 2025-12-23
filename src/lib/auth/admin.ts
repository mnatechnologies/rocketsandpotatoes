import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

interface AdminAuthResult {
  authorized: boolean;
  userId: string | null;
  error?: NextResponse;
}

/**
 * Check if the current user is an admin.
 * 
 * To make a user an admin, set their publicMetadata in Clerk Dashboard:
 * { "role": "admin" }
 * 
 * Or via Clerk API:
 * await clerkClient.users.updateUser(userId, {
 *   publicMetadata: { role: 'admin' }
 * });
 */
export type UserRole = 'admin' | 'manager' | 'staff';


export async function requireAdmin(): Promise<AdminAuthResult> {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return {
      authorized: false,
      userId: null,
      error: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ),
    };
  }

  // Check for admin role in publicMetadata
  const role = (sessionClaims as { metadata?: { role?: string } })?.metadata?.role;
  
  if (role !== 'admin') {
    return {
      authorized: false,
      userId,
      error: NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    userId,
  };
}

export async function requireManagement(): Promise<AdminAuthResult> {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return {
      authorized: false,
      userId: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const role = (sessionClaims as { metadata?: { role?: string } })?.metadata?.role;
  
  // Admin (superuser) OR Manager can approve management decisions
  if (role !== 'admin' && role !== 'manager') {
    return {
      authorized: false,
      userId,
      error: NextResponse.json(
        { error: 'Forbidden: Management approval access required' },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, userId };
}

/**
 * Helper to quickly check admin and return early if not authorized.
 * Use at the start of admin route handlers:
 * 
 * const adminCheck = await requireAdmin();
 * if (!adminCheck.authorized) return adminCheck.error;
 */
export async function getUserRole(): Promise<UserRole | null> {
  const { sessionClaims } = await auth();
  const role = (sessionClaims as { metadata?: { role?: string } })?.metadata?.role;
  return role as UserRole || null;
}







