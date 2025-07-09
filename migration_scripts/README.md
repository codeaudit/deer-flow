# deer-flow to Suna Billing Migration

This directory contains all the scripts and files needed to migrate deer-flow from its current setup to use Suna's billing and account management system.

## 🎯 What This Migration Does

- **Replaces** deer-flow's current authentication with Basejump account management
- **Adds** Stripe-based billing and subscription management
- **Implements** workflow-based usage tracking (adapted from Suna's agent tracking)
- **Preserves** deer-flow's workflow architecture while adding billing

## 📋 Prerequisites

1. **Access to deer-flow and suna codebases**
   - deer-flow project (current directory)
   - suna project (in parent directory or sibling directory)

2. **Supabase Project**
   - SUPABASE_URL environment variable
   - SUPABASE_SERVICE_ROLE_KEY environment variable

3. **Stripe Account (for billing)**
   - STRIPE_SECRET_KEY environment variable
   - STRIPE_PUBLISHABLE_KEY environment variable

## 🚀 Quick Start

1. **Run the master migration script:**
   ```bash
   ./migration_scripts/00_EXECUTE_MIGRATION.sh
   ```

2. **Follow the interactive prompts** to complete each phase

## 📁 File Structure

```
migration_scripts/
├── 00_EXECUTE_MIGRATION.sh     # Master execution script
├── 01_backup_and_reset.sql     # Database reset script
├── 02_copy_direct_migrations.sh # Copy Suna migrations
├── 03_run_migrations.sh        # Database migration runner
├── 04_update_workflow.py       # Code integration guide
└── README.md                   # This file

migrations/
├── 003_basejump_setup.sql      # Basejump foundation
├── 004_basejump_accounts.sql   # Account management
├── 005_basejump_invitations.sql # Team invitations
├── 006_basejump_billing.sql    # Billing system
├── 007_workflow_core.sql       # deer-flow workflow schema
└── 008_knowledge_base.sql      # Knowledge base system

src/auth/
├── billing.py                  # Billing functions
└── database.py                 # Database connection
```

## 🔄 Migration Phases

### Phase 1: Prepare Migration Files
- Copies direct migration files from Suna
- Creates modified files adapted for deer-flow

### Phase 2: Database Migration
- Resets current database to clean slate
- Installs Basejump foundation
- Adds account management and billing
- Adds workflow-specific tracking

### Phase 3: Code Integration
- Updates backend billing integration
- Modifies workflow execution
- Provides frontend integration guide

## 🗄️ Database Schema Changes

### What Gets Added:
- `basejump.accounts` - User account management
- `basejump.account_user` - Account membership
- `basejump.billing_customers` - Stripe customer data
- `basejump.billing_subscriptions` - Subscription management
- `projects` - Project organization
- `threads` - Workflow conversations
- `messages` - Message storage
- `workflow_executions` - Usage tracking (replaces agent runs)
- `knowledge_base_entries` - Knowledge base

### What Gets Removed:
- All existing deer-flow tables (clean slate approach)

## 🔧 Code Changes Required

### Backend (`src/workflow.py`):
```python
# Change function signature
async def run_agent_workflow_async(
    user_input: str,
    account_id: str,  # Changed from user_id
    # ... other params
):
    # Add billing check
    can_run, message = await check_billing_status(account_id)
    if not can_run:
        raise ValueError(f"Billing limit reached: {message}")
    
    # Track workflow execution
    execution_id = await create_workflow_execution(account_id, thread_id)
    # ... rest of workflow
```

### Frontend:
- Replace current auth with Basejump authentication
- Add billing/usage displays
- Add subscription management UI

## 📊 Billing Configuration

Update `src/auth/billing.py` with your Stripe price IDs:

```python
SUBSCRIPTION_TIERS = {
    'price_1ABC123': {'name': 'free', 'minutes': 60},
    'price_1DEF456': {'name': 'pro', 'minutes': 300},
    # Add your Stripe price IDs here
}
```

## 🧪 Testing Checklist

After migration, test:

- [ ] User registration and login
- [ ] Account creation and management
- [ ] Workflow execution with billing checks
- [ ] Usage tracking and limits
- [ ] Subscription management
- [ ] Team invitations (if using teams)

## 🔍 Troubleshooting

### Common Issues:

1. **Migration fails on database reset**
   - Ensure you have SUPERUSER privileges in Supabase
   - Try running each migration manually in SQL editor

2. **Billing functions not working**
   - Check environment variables are set
   - Verify Supabase connection is working

3. **Frontend auth issues**
   - Update frontend to use Basejump auth endpoints
   - Check RLS policies are working correctly

### Getting Help:

1. Check the Basejump documentation: https://usebasejump.com
2. Review Suna's implementation for examples
3. Check Supabase logs for detailed error messages

## 🎯 What's Different from Suna

| Aspect | Suna | deer-flow |
|--------|------|-----------|
| **Tracking Unit** | Individual agent runs | Complete workflow executions |
| **Agent System** | Marketplace + custom agents | Fixed workflow with predefined agents |
| **Usage Metric** | Agent run duration | Workflow execution duration |
| **Tables** | `agent_runs` | `workflow_executions` |

## 📚 Next Steps After Migration

1. **Configure Stripe**
   - Set up webhook endpoints
   - Create subscription products
   - Test payment flows

2. **Update Frontend**
   - Implement Basejump authentication
   - Add billing UI components
   - Add usage monitoring

3. **Production Deployment**
   - Set up environment variables
   - Configure domains and SSL
   - Test end-to-end workflows

## ⚠️ Important Notes

- **Backup First**: This migration resets your database completely
- **Test Thoroughly**: Test all workflows after migration
- **Stripe Setup**: Configure Stripe products and webhooks
- **Frontend Work**: Significant frontend changes needed for full integration

---

**Need Help?** Check the Suna codebase for implementation examples and the Basejump documentation for detailed guides. 