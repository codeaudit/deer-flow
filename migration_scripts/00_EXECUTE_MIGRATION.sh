#!/bin/bash

# ========================================
# deer-flow to Suna Billing Migration
# Master Execution Script
# ========================================

echo "================================================================"
echo "deer-flow Supabase Migration to Suna's Billing System"
echo "================================================================"
echo ""
echo "This script will guide you through migrating deer-flow to use"
echo "Suna's billing and account management system."
echo ""
echo "⚠️  WARNING: This will RESET your current deer-flow database!"
echo "   Make sure to backup any important data first."
echo ""

# Check prerequisites
echo "Checking prerequisites..."

# Check if we're in the right directory
if [ ! -f "src/workflow.py" ]; then
    echo "❌ ERROR: This script must be run from the deer-flow root directory"
    echo "   Make sure you're in the directory containing src/workflow.py"
    exit 1
fi

# Check if suna directory exists
if [ ! -d "suna" ]; then
    echo "❌ ERROR: suna directory not found"
    echo "   Make sure the suna project is available in the same parent directory"
    echo "   Directory structure should be:"
    echo "   parent-dir/"
    echo "   ├── deer-flow/ (current directory)"
    echo "   └── suna/"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Environment variables check
echo "Environment Variables:"
echo "Please ensure you have the following environment variables set:"
echo ""
echo "Required:"
echo "- SUPABASE_URL: Your Supabase project URL"
echo "- SUPABASE_SERVICE_ROLE_KEY: Your service role key"
echo ""
echo "Optional (for Stripe billing):"
echo "- STRIPE_SECRET_KEY: Your Stripe secret key"
echo "- STRIPE_PUBLISHABLE_KEY: Your Stripe publishable key"
echo ""

read -p "Do you have these environment variables set? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please set the required environment variables and run this script again."
    echo ""
    echo "Example:"
    echo 'export SUPABASE_URL="https://your-project.supabase.co"'
    echo 'export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"'
    exit 1
fi

echo ""
echo "================================================================"
echo "Migration Steps Overview"
echo "================================================================"
echo ""
echo "Phase 1: Prepare Migration Files"
echo "  ✓ Copy direct migration files from Suna"
echo "  ✓ Create modified migration files for deer-flow"
echo ""
echo "Phase 2: Database Migration"
echo "  • Backup and reset database"
echo "  • Install Basejump foundation"
echo "  • Install account management"
echo "  • Install billing system"
echo "  • Install workflow tracking"
echo ""
echo "Phase 3: Code Integration"
echo "  • Update backend billing integration"
echo "  • Update workflow execution tracking"
echo "  • Update frontend authentication"
echo ""

read -p "Ready to proceed with the migration? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled."
    exit 1
fi

echo ""
echo "================================================================"
echo "Phase 1: Preparing Migration Files"
echo "================================================================"

# Make scripts executable
chmod +x migration_scripts/*.sh

# Run the copy script
echo "Copying direct migration files from Suna..."
./migration_scripts/02_copy_direct_migrations.sh

if [ $? -ne 0 ]; then
    echo "❌ Failed to copy migration files"
    exit 1
fi

echo "✅ Migration files prepared successfully"
echo ""

echo "================================================================"
echo "Phase 2: Database Migration"
echo "================================================================"
echo ""
echo "The next step will guide you through running SQL migrations."
echo "You'll need to copy and paste SQL commands into your Supabase dashboard."
echo ""

read -p "Ready to start database migration? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration paused. Run './migration_scripts/03_run_migrations.sh' when ready."
    exit 1
fi

# Run the migration script
./migration_scripts/03_run_migrations.sh

echo ""
echo "================================================================"
echo "Phase 3: Code Integration Guide"
echo "================================================================"

# Show the workflow integration guide
python3 migration_scripts/04_update_workflow.py

echo ""
echo "================================================================"
echo "Migration Summary"
echo "================================================================"
echo ""
echo "✅ Database migrations completed"
echo "✅ Billing system installed"
echo "✅ Account management installed"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Update your deer-flow code:"
echo "   - Modify src/workflow.py (see guide above)"
echo "   - Update frontend to use Basejump accounts"
echo "   - Add Stripe webhook endpoints"
echo ""
echo "2. Configure Stripe:"
echo "   - Set up your subscription products"
echo "   - Configure webhook endpoints"
echo "   - Update SUBSCRIPTION_TIERS in src/auth/billing.py"
echo ""
echo "3. Test the integration:"
echo "   - User registration and login"
echo "   - Workflow execution with billing checks"
echo "   - Subscription management"
echo ""
echo "4. Frontend Updates Needed:"
echo "   - Replace current auth with Basejump auth"
echo "   - Add billing/usage displays"
echo "   - Add subscription management UI"
echo ""
echo "📁 Files Created/Modified:"
echo "   - migrations/*.sql (database schema)"
echo "   - src/auth/billing.py (billing functions)"
echo "   - src/auth/database.py (database connection)"
echo ""
echo "📖 Documentation:"
echo "   - Check suna's frontend for UI component examples"
echo "   - Basejump docs: https://usebasejump.com"
echo "   - Stripe docs for webhook setup"
echo ""
echo "================================================================"
echo "Migration Complete! 🎉"
echo "================================================================" 