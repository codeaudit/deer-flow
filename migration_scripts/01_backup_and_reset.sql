-- Backup and Reset Script for deer-flow Supabase Migration
-- WARNING: This will delete ALL existing data

-- First, let's see what tables currently exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Backup existing data (if you want to save anything)
-- Uncomment and modify these lines if you have important data to backup:
-- CREATE TABLE backup_your_table_name AS SELECT * FROM your_table_name;

-- Drop all existing tables and schemas (except system ones)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all tables in public schema
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    
    -- Drop all sequences in public schema
    FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(r.sequence_name) || ' CASCADE';
    END LOOP;
    
    -- Drop all functions in public schema (except system functions)
    FOR r IN (SELECT proname FROM pg_proc WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(r.proname) || ' CASCADE';
    END LOOP;
    
    -- Drop all custom types in public schema
    FOR r IN (SELECT typname FROM pg_type WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND typtype = 'e') LOOP
        EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
    END LOOP;
END $$;

-- Drop basejump schema if it exists
DROP SCHEMA IF EXISTS basejump CASCADE;

-- Verify clean slate
SELECT tablename FROM pg_tables WHERE schemaname IN ('public', 'basejump') ORDER BY tablename; 