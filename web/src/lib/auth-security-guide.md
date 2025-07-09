# DeerFlow Authentication Security Guide

## Overview

DeerFlow uses a secure authentication setup with Supabase that follows security best practices. This guide explains when to use different authentication methods.

## Security Principles

### Server-Side Security (High Security)
- **Use `getUser()`** for all server-side operations
- **Use `requireAuth()`** utility for API routes
- Always validate JWT tokens with Supabase servers
- Never trust client-side session data for security decisions

### Client-Side UI (Lower Security)
- **Use `getSession()`** for UI state management only
- **Use auth context** for component state
- Acceptable for display logic and navigation
- Not suitable for security-critical operations

## When to Use What

### ✅ Use `getUser()` (Secure)
- API routes (`/app/api/...`)
- Server components with sensitive data
- Middleware for route protection
- Database operations
- File access controls
- Billing operations
- Admin functions

### ✅ Use `getSession()` (UI Only)
- Client-side components
- Navigation state
- Profile display
- Theme preferences
- Non-sensitive UI logic

## Implementation Examples

### Server-Side API Route (Secure)
```typescript
import { requireAuth } from '@/lib/auth-utils';

export async function GET() {
  try {
    const user = await requireAuth(); // Throws if not authenticated
    // Proceed with secure operation
    return NextResponse.json({ data: 'secure data' });
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
```

### Client-Side Component (UI)
```typescript
import { useAuth } from '@/components/auth/AuthProvider';

export function MyComponent() {
  const { user, session } = useAuth(); // Uses getSession() internally
  
  if (!user) {
    return <div>Please sign in</div>;
  }
  
  return <div>Welcome, {user.email}</div>;
}
```

### Client-Side Security Check (When Needed)
```typescript
import { verifyClientAuth } from '@/lib/auth-utils';

export async function handleSensitiveAction() {
  const { user, error } = await verifyClientAuth(); // Uses getUser()
  
  if (!user || error) {
    throw new Error('Authentication required');
  }
  
  // Proceed with sensitive operation
}
```

## Current Implementation

### ✅ Secure (Using `getUser()`)
- **Layout.tsx**: Server-side user detection
- **Middleware.ts**: Route protection
- **Auth Utils**: Server-side authentication helpers

### ✅ Appropriate (Using `getSession()`)
- **AuthProvider**: Client-side state management
- **AuthInitializer**: Client-side initialization
- **Landing Header**: UI display logic

## Security Benefits

1. **JWT Validation**: `getUser()` validates tokens with Supabase servers
2. **Anti-Tampering**: Cannot be manipulated by client-side code
3. **Fresh Data**: Always gets current user state from server
4. **Audit Trail**: Server-side authentication is logged and traceable

## Performance Considerations

- `getUser()`: Slower (network call) but secure
- `getSession()`: Faster (local storage) but less secure
- Use appropriate method based on security needs vs performance requirements

## Migration Notes

- Server-side code has been updated to use `getUser()`
- Client-side UI code continues to use `getSession()` for performance
- New utility functions provide clear security boundaries
- All API routes should use `requireAuth()` utility

This setup provides maximum security for sensitive operations while maintaining good performance for UI interactions. 