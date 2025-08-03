-- TEMPORARY: Disable RLS for debugging (ONLY FOR TESTING)
-- This will help us see if the issue is RLS-specific or something else
-- DO NOT LEAVE THIS IN PRODUCTION

-- Temporarily disable RLS on sessions table
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;

-- Check that RLS is now disabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'sessions';

-- Test message
SELECT 'RLS temporarily disabled for debugging. Test your AI now.' as status;