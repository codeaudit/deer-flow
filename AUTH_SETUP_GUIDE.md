# Deer Flow Authentication Setup Guide

This guide walks you through setting up Supabase authentication in Deer Flow, copied from Suna's proven implementation.

## ✅ What's Been Completed

The following authentication files have been successfully migrated from Suna:

### Backend Files Migrated
- ✅ `src/auth/config.py` - Authentication configuration management
- ✅ `src/auth/database.py` - Supabase database connection
- ✅ `src/auth/auth_utils.py` - JWT authentication utilities
- ✅ `src/auth/__init__.py` - Module initialization
- ✅ `src/auth/example_integration.py` - Integration examples

### Database Migrations
- ✅ `migrations/000_setup.sql` - Basejump setup
- ✅ `migrations/001_accounts.sql` - Account management
- ✅ `migrations/002_invitations.sql` - User invitations

### Dependencies
- ✅ `pyproject.toml` updated with `supabase>=2.15.0` and `pyjwt>=2.10.1`
- ✅ `auth.env.template` created for environment configuration

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Name it "deer-flow-auth"
4. Choose region and password
5. Wait 5-10 minutes for creation

### Step 2: Get Credentials
1. Go to Project Settings → API
2. Copy these values:
   - Project URL
   - `anon` public key  
   - `service_role` secret key

### Step 3: Configure Environment
1. Copy the template: `cp auth.env.template .env`
2. Edit `.env` with your Supabase credentials:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Step 4: Install Dependencies
```bash
pip install -e .
```

### Step 5: Run Database Migrations
In your Supabase dashboard:
1. Go to SQL Editor
2. Run each migration file in order:
   - `migrations/000_setup.sql`
   - `migrations/001_accounts.sql` 
   - `migrations/002_invitations.sql`

## 💻 Integration Examples

### Option 1: Optional Authentication (Recommended)
```python
from src.auth.auth_utils import get_optional_user_id
from src.auth.database import db_connection

@app.post("/api/chat")
async def chat_endpoint(request: Request, message: str):
    # Get user ID if authenticated, None if not
    user_id = await get_optional_user_id(request)
    
    # Your existing deer-flow logic here...
    response = process_message(message)
    
    # Save to database if user is authenticated
    if user_id:
        client = await db_connection.client
        await client.table('conversations').insert({
            'user_id': user_id,
            'message': message,
            'response': response
        }).execute()
    
    return {"response": response}
```

### Option 2: Required Authentication
```python
from src.auth.auth_utils import get_current_user_id_from_jwt

@app.get("/api/profile")
async def get_profile(user_id: str = Depends(get_current_user_id_from_jwt)):
    # This endpoint requires authentication
    # user_id is automatically extracted from JWT
    return {"user_id": user_id}
```

## 🎯 Next Steps

### Immediate (Ready to use)
- ✅ Authentication is working
- ✅ User registration/login via Supabase Auth
- ✅ JWT token validation  
- ✅ Database connections with RLS

### Phase 2: Frontend Integration
- [ ] Copy Supabase auth components from Suna frontend
- [ ] Add login/signup UI to deer-flow frontend
- [ ] Implement auth state management

### Phase 3: Feature Additions
- [ ] Conversation history storage
- [ ] User preferences
- [ ] File upload capabilities
- [ ] Real-time subscriptions

## 🔧 Troubleshooting

### "Missing environment variables" error
- Check your `.env` file exists in the project root
- Verify all three Supabase variables are set
- Make sure no trailing spaces in values

### "Import supabase could not be resolved"
- Run `pip install -e .` to install dependencies
- Verify `supabase>=2.15.0` is in requirements

### Database connection errors
- Verify your Supabase project is running
- Check your project URL and keys are correct
- Ensure your IP is not blocked (Supabase allows all by default)

## 📚 Architecture Overview

```
deer-flow/
├── src/auth/                    # Authentication module
│   ├── config.py               # Environment configuration
│   ├── database.py             # Supabase connection
│   ├── auth_utils.py           # JWT utilities
│   └── example_integration.py  # Usage examples
├── migrations/                 # Database schema
└── auth.env.template          # Environment template
```

### Key Features Available
- **Multi-tenant**: Account-based user management
- **Secure**: Row Level Security (RLS) for data isolation
- **Scalable**: Supabase handles auth infrastructure  
- **JWT-based**: Standard token authentication
- **Optional**: Backwards compatible with anonymous usage

## 🔐 Security Notes

- Supabase handles password security and user management
- JWT tokens are validated client-side for performance
- Row Level Security ensures users only see their data
- Service role key should be kept secret (backend only)
- Anon key is safe to use in frontend applications

## 📞 Support

- Check `src/auth/example_integration.py` for usage patterns
- Review Supabase docs: [https://supabase.com/docs](https://supabase.com/docs)
- Original implementation: Suna repository (reference only) 