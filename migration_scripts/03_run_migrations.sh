#!/bin/bash

# Run Migration Script for deer-flow Supabase Migration
# Execute migrations in the correct order

echo "=========================================="
echo "deer-flow Supabase Migration Execution"
echo "=========================================="

# Check if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "ERROR: Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables"
    echo "Example:"
    echo "export SUPABASE_URL='https://your-project.supabase.co'"
    echo "export SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'"
    exit 1
fi

# Function to run SQL file
run_migration() {
    local file=$1
    local description=$2
    
    echo "Running: $description"
    echo "File: $file"
    
    if [ ! -f "$file" ]; then
        echo "ERROR: Migration file $file does not exist"
        exit 1
    fi
    
    # Use psql to run the migration
    # You can also use Supabase CLI: supabase db reset --db-url "$DATABASE_URL"
    # For now, we'll provide the SQL commands
    echo "Please run this file manually in your Supabase SQL editor:"
    echo "Contents of $file:"
    echo "----------------------------------------"
    cat "$file"
    echo "----------------------------------------"
    echo ""
    
    read -p "Press Enter after you've run this migration in Supabase SQL editor..."
}

echo "IMPORTANT: Before proceeding, make sure you have:"
echo "1. Backed up any important data from your deer-flow database"
echo "2. Access to your Supabase project dashboard"
echo "3. The SQL editor open in Supabase"
echo ""
read -p "Ready to proceed? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled."
    exit 1
fi

echo ""
echo "Step 1: Clean Slate - Backup and Reset Database"
run_migration "migration_scripts/01_backup_and_reset.sql" "Backup and reset database to clean slate"

echo ""
echo "Step 2: Core Basejump Setup"
run_migration "migrations/003_basejump_setup.sql" "Install Basejump foundation"

echo ""
echo "Step 3: Account Management"
run_migration "migrations/004_basejump_accounts.sql" "Install account management system"

echo ""
echo "Step 4: Team Invitations"
run_migration "migrations/005_basejump_invitations.sql" "Install team invitation system"

echo ""
echo "Step 5: Billing Infrastructure"
run_migration "migrations/006_basejump_billing.sql" "Install billing and subscription system"

echo ""
echo "Step 6: Workflow Core"
run_migration "migrations/007_workflow_core.sql" "Install deer-flow workflow system"

echo ""
echo "Step 7: Knowledge Base"
run_migration "migrations/008_knowledge_base.sql" "Install knowledge base system"

echo ""
echo "=========================================="
echo "Migration Complete!"
echo "=========================================="
echo ""
echo "Next Steps:"
echo "1. Update your deer-flow backend code to use the new billing system"
echo "2. Update your frontend to use Basejump account management"
echo "3. Configure your Stripe webhooks to point to the new billing endpoints"
echo "4. Test the billing integration"
echo ""
echo "Files to update in your deer-flow codebase:"
echo "- src/workflow.py (add billing integration)"
echo "- src/auth/billing.py (already created)"
echo "- src/auth/database.py (already created)"
echo "- Frontend components to use Basejump accounts" 