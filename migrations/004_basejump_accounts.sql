BEGIN;

/**
  * -------------------------------------------------------
  * Section - Account Access Policies
  * -------------------------------------------------------
 */

-- Enable RLS on accounts table if not already enabled
ALTER TABLE basejump.accounts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view accounts they are members of" ON basejump.accounts;
DROP POLICY IF EXISTS "Users can update accounts they own" ON basejump.accounts;

-- Allow users to select accounts they are members of
CREATE POLICY "Users can view accounts they are members of"
    ON basejump.accounts
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM basejump.account_user au
            WHERE au.account_id = id
              AND au.user_id = auth.uid()
        )
    );

-- Allow users to update accounts they own
CREATE POLICY "Users can update accounts they own"
    ON basejump.accounts
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM basejump.account_user au
            WHERE au.account_id = id
              AND au.user_id = auth.uid()
              AND au.account_role = 'owner'
        )
    );

/**
  * -------------------------------------------------------
  * Section - Account User Access Policies
  * -------------------------------------------------------
 */

-- Enable RLS on account_user table if not already enabled
ALTER TABLE basejump.account_user ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view members of accounts they belong to" ON basejump.account_user;

-- Allow users to view account members for accounts they belong to
CREATE POLICY "Users can view members of accounts they belong to"
    ON basejump.account_user
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM basejump.account_user au
            WHERE au.account_id = account_id
              AND au.user_id = auth.uid()
        )
    );

/**
  * -------------------------------------------------------
  * Section - Account Helper Functions
  * -------------------------------------------------------
 */

-- Drop existing trigger first (before dropping its function)
DROP TRIGGER IF EXISTS ensure_personal_account_on_user_create ON auth.users;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.get_user_accounts();
DROP FUNCTION IF EXISTS public.get_personal_account();
DROP FUNCTION IF EXISTS basejump.ensure_personal_account();

-- Function to get all accounts a user has access to
CREATE OR REPLACE FUNCTION public.get_user_accounts()
    RETURNS TABLE (
        account_id uuid,
        account_role basejump.account_role,
        is_primary_owner boolean,
        name text,
        slug text,
        personal_account boolean,
        created_at timestamp with time zone,
        updated_at timestamp with time zone
    )
    LANGUAGE sql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    SELECT 
        a.id as account_id,
        au.account_role,
        a.primary_owner_user_id = auth.uid() as is_primary_owner,
        a.name,
        a.slug,
        a.personal_account,
        a.created_at,
        a.updated_at
    FROM basejump.accounts a
    JOIN basejump.account_user au ON au.account_id = a.id
    WHERE au.user_id = auth.uid()
    ORDER BY a.created_at DESC;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_accounts() TO authenticated;

-- Function to get a user's personal account
CREATE OR REPLACE FUNCTION public.get_personal_account()
    RETURNS TABLE (
        account_id uuid,
        account_role basejump.account_role,
        is_primary_owner boolean,
        name text,
        slug text,
        personal_account boolean,
        created_at timestamp with time zone,
        updated_at timestamp with time zone
    )
    LANGUAGE sql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    SELECT 
        a.id as account_id,
        au.account_role,
        true as is_primary_owner,
        a.name,
        a.slug,
        a.personal_account,
        a.created_at,
        a.updated_at
    FROM basejump.accounts a
    JOIN basejump.account_user au ON au.account_id = a.id
    WHERE au.user_id = auth.uid()
    AND a.personal_account = true
    LIMIT 1;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_personal_account() TO authenticated;

-- Function to ensure a user has a personal account
CREATE OR REPLACE FUNCTION basejump.ensure_personal_account()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
AS $$
DECLARE
    personal_account_id uuid;
BEGIN
    -- Check if user already has a personal account
    SELECT a.id INTO personal_account_id
    FROM basejump.accounts a
    WHERE a.primary_owner_user_id = NEW.id
    AND a.personal_account = true;

    -- If no personal account exists, create one
    IF personal_account_id IS NULL THEN
        INSERT INTO basejump.accounts (
            primary_owner_user_id,
            name,
            personal_account,
            created_by,
            updated_by
        ) VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
            true,
            NEW.id,
            NEW.id
        ) RETURNING id INTO personal_account_id;

        -- Add user as owner of their personal account
        INSERT INTO basejump.account_user (
            user_id,
            account_id,
            account_role
        ) VALUES (
            NEW.id,
            personal_account_id,
            'owner'
        );
    END IF;

    RETURN NEW;
END;
$$;

-- Create trigger to ensure personal account creation
CREATE TRIGGER ensure_personal_account_on_user_create
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION basejump.ensure_personal_account();

COMMIT; 