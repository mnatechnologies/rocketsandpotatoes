-- Migration: Add INSERT policy for customers table to support webhook operations
-- This allows the service role or anon key to insert new customer records
-- Run this in your Supabase SQL Editor

-- Add INSERT policy for customers table
-- This allows inserts from webhooks (service role bypasses RLS anyway, but this helps with anon key if needed)
CREATE POLICY "Allow service role to insert customers" ON customers
    FOR INSERT
    WITH CHECK (true);

-- Alternative: If you want to restrict inserts to only include clerk_user_id
-- Uncomment the line below and comment out the one above:
-- CREATE POLICY "Allow webhook inserts with clerk_user_id" ON customers
--     FOR INSERT
--     WITH CHECK (clerk_user_id IS NOT NULL);

-- Add UPDATE policy for customers table to support user.updated events
CREATE POLICY "Allow service role to update customers" ON customers
    FOR UPDATE
    USING (true)
    WITH CHECK (true);
