import { NextRequest, NextResponse } from 'next/server';
import { currentUser, clerkClient } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/clerk-users - Fetch Clerk users not yet in staff table
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || user.publicMetadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all Clerk users
    const client = await clerkClient();
    const { data: clerkUsers } = await client.users.getUserList({ limit: 500 });

    // Fetch all existing staff clerk_user_ids
    const { data: existingStaff } = await supabase
      .from('staff')
      .select('clerk_user_id')
      .not('clerk_user_id', 'is', null);

    const existingClerkIds = new Set(
      existingStaff?.map(s => s.clerk_user_id) || []
    );

    // Filter out users who already have staff records
    const availableUsers = clerkUsers
      .filter(clerkUser => !existingClerkIds.has(clerkUser.id))
      .map(clerkUser => ({
        id: clerkUser.id,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        fullName: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Unnamed User',
        email: clerkUser.emailAddresses[0]?.emailAddress || 'No email',
        imageUrl: clerkUser.imageUrl,
      }));

    return NextResponse.json({ success: true, users: availableUsers });
  } catch (error) {
    console.error('[CLERK_USERS_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch Clerk users' },
      { status: 500 }
    );
  }
}
