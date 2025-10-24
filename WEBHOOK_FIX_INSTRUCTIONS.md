# Clerk Webhook Fix - Customer Creation Issue

## Problem
The Clerk webhook was not adding users to the Supabase customers table because:
1. The webhook was using `NEXT_PUBLIC_SUPABASE_ANON_KEY` instead of a service role key
2. The anon key is subject to Row Level Security (RLS) policies
3. The customers table had RLS enabled but no INSERT/UPDATE policies, blocking all inserts

## Solution
You have **TWO OPTIONS** to fix this issue:

### Option 1: Use Service Role Key (RECOMMENDED)
This is the most secure approach as it properly bypasses RLS for administrative operations.

**Steps:**
1. Go to your Supabase project dashboard
2. Navigate to: Settings > API
3. Copy the `service_role` key (keep this secret!)
4. Add it to your `.env` file:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```
5. Restart your development server

**Note:** The webhook code has been updated to use this key automatically.

### Option 2: Add RLS Policies
If you prefer not to use the service role key, you can add RLS policies that allow inserts.

**Steps:**
1. Go to your Supabase project dashboard
2. Navigate to: SQL Editor
3. Run the SQL migration file: `supabase_migration_add_customer_insert_policy.sql`
4. This will add INSERT and UPDATE policies to the customers table

**WARNING:** Option 2 is less secure as it allows any request with the anon key to insert customers.

## Verification
After applying either fix:

1. Test the webhook by signing up a new user in your application
2. Check the server logs for `[CLERK_WEBHOOK]` messages
3. Verify the customer appears in your Supabase customers table
4. Check that the `clerk_user_id` field is populated correctly

## What Was Changed
- Updated `src/app/api/webhooks/clerk/route.ts` to use `SUPABASE_SERVICE_ROLE_KEY`
- Added validation to ensure the service role key is configured
- Added clear error messages for debugging
- Created SQL migration file for alternative RLS policy approach

## Troubleshooting
If the webhook still doesn't work:

1. **Check Clerk webhook configuration:**
   - URL should be: `https://yourdomain.com/api/webhooks/clerk` (or `http://localhost:3000/api/webhooks/clerk` for local)
   - Make sure you've added `localhost` to Clerk's allowed domains for local testing
   - Verify the webhook secret matches `CLERK_WEBHOOK_SECRET` in your `.env`

2. **Check server logs:**
   - Look for `[CLERK_WEBHOOK]` log messages
   - Check for "SUPABASE_SERVICE_ROLE_KEY not configured" error
   - Look for Supabase error messages

3. **Verify environment variables:**
   - Ensure all required env vars are set
   - Restart your server after adding new environment variables

4. **Test webhook manually:**
   - Use Clerk's webhook testing feature in the dashboard
   - Check the webhook delivery logs in Clerk

## Security Notes
- **NEVER** commit your service role key to version control
- The service role key bypasses ALL RLS policies - use it only in trusted server-side code
- Keep your `.env` file in `.gitignore`
- For production, use environment variables in your hosting platform (Vercel, etc.)
