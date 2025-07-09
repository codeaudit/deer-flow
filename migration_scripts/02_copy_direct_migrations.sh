#!/bin/bash

# Copy Direct Migration Files from Suna to deer-flow
# These files can be used as-is without modifications

echo "Copying direct migration files from Suna to deer-flow..."

# Ensure migrations directory exists
mkdir -p migrations

# Copy basejump accounts migration
echo "Copying basejump accounts migration..."
cp suna/backend/supabase/migrations/20240414161947_basejump-accounts.sql migrations/004_basejump_accounts.sql

# Copy basejump invitations migration
echo "Copying basejump invitations migration..."
cp suna/backend/supabase/migrations/20240414162100_basejump-invitations.sql migrations/005_basejump_invitations.sql

# Copy basejump billing migration
echo "Copying basejump billing migration..."
cp suna/backend/supabase/migrations/20240414162131_basejump-billing.sql migrations/006_basejump_billing.sql

echo "Direct migration files copied successfully!"
echo ""
echo "Migration files created:"
echo "- migrations/003_basejump_setup.sql (already created)"
echo "- migrations/004_basejump_accounts.sql"
echo "- migrations/005_basejump_invitations.sql"
echo "- migrations/006_basejump_billing.sql" 