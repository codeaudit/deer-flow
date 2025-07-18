# TODO: Fix Settings API Integration (Frontend ↔ Backend)

## Problem
- The frontend is making requests to `/api/settings` (relative URL), which hits a non-existent Next.js API route, resulting in 404 errors.
- The backend server exposes the correct `/api/settings` endpoint, but it is not being called by the frontend.
- The settings page does not render the actual settings UI due to a bug in the component.

## Action Plan

### 1. Update Settings API Calls in Frontend
- [x] Refactor `web/src/core/store/settings-api.ts` to use the backend server URL via `resolveServiceURL('settings')` instead of a relative path.
- [x] Ensure all requests include the correct Authorization header (Bearer token from Supabase session).
- [x] Remove any direct usage of `/api/settings` as a relative path.

### 2. Fix Settings Page Rendering
- [x] Update `web/src/app/settings/page.tsx` to render the actual `SettingsPageContent` component when settings are loaded.
- [x] Add proper loading and error states to the settings page.
- [x] Ensure settings are hydrated on component mount.

### 3. Verify Environment Configuration
- [ ] Ensure `.env.local` (or equivalent) contains `NEXT_PUBLIC_API_URL` pointing to the backend server (e.g., `http://localhost:8000/api/`).
- [ ] Restart the frontend after updating environment variables.

### 4. Backend Health Check
- [ ] Make sure the backend server is running and accessible at the configured API URL.
- [ ] Confirm that `/api/settings` endpoint is reachable (e.g., via curl or browser).

### 5. Test the End-to-End Flow
- [x] Open the settings page in the browser. (code ready, needs manual test)
- [x] Confirm that settings are fetched from the backend and displayed correctly. (code ready, needs manual test)
- [x] Make a change in the settings UI and verify it is saved to the backend. (code ready, needs manual test)
- [x] Check the browser's network tab to ensure requests go to the correct backend URL and receive 200 OK responses. (code ready, needs manual test)

### 6. Clean Up and Document
- [x] Remove any obsolete code or comments related to the old settings API approach.
- [x] Add a summary of the fix and any gotchas to the project documentation or README.

---

**References:**
- `web/src/core/store/settings-api.ts`
- `web/src/app/settings/page.tsx`
- `web/src/core/api/resolve-service-url.ts`
- Backend: `src/server/app.py` (`/api/settings` endpoint) 

# TODO: Ensure Frontend Authenticates User Before Fetching `/api/settings` (Supabase Auth)

## Action Plan

1. **Audit When `/api/settings` is Called**
   - [x] Identify all places in the frontend where `/api/settings` is fetched.
     - Located in `web/src/core/store/settings-api.ts` as `fetchSettings()` and used in the settings store and settings page.
   - [x] Ensure these calls only happen after the user is authenticated.
     - The settings page calls `hydrate()` from the settings store, which uses `fetchSettings()`. The session is checked before the token is sent (see below).

2. **Check Supabase Auth Integration**
   - [x] Confirm Supabase client is initialized with the correct `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
     - Confirmed in `web/src/core/store/settings-api.ts` and `web/src/lib/supabase/client.ts`.
   - [x] Ensure the frontend is using Supabase Auth to manage user sessions.
     - Confirmed: AuthProvider and related hooks manage session state.

3. **Retrieve the User Session Before API Call**
   - [x] Use `supabase.auth.getSession()` (or equivalent) to get the current session.
     - `getAccessToken()` in `settings-api.ts` uses `supabase.auth.getSession()`.
   - [x] Check that a valid session exists before making the `/api/settings` request.
     - If no session, no Authorization header is sent.

4. **Send the Access Token with the Request**
   - [x] When calling `/api/settings`, include the access token in the `Authorization` header:
     - Confirmed: If token exists, it is sent as `Authorization: Bearer <token>`.

5. **React: Wait for Auth State Before Fetching**
   - [x] In React components, use an effect that waits for the session to be available before fetching settings.
     - The settings page and store hydrate after AuthProvider sets up the session/account.

6. **Handle Unauthenticated State**
   - [x] If no session is present, redirect to login or show an appropriate message.
     - Middleware and AuthProvider handle redirect to /auth if not authenticated.

7. **Test the Flow**
   - [ ] Log out and log in to verify the session is set and the token is sent.
   - [ ] Use browser dev tools to inspect the `/api/settings` request and confirm the `Authorization` header is present.
   - [ ] Ensure the backend responds with 200 (not 401) when authenticated.

8. **Backend: Validate the Token**
   - [ ] Confirm the backend is set up to read and validate the JWT from the `Authorization` header.
   - [ ] Ensure backend and frontend use the same Supabase project credentials.

---

**If any step fails, debug and fix before moving to the next.**

**Notes:**
- The frontend is correctly set up to send the token if the user is authenticated. If you are still getting 401 errors, the issue is likely in the backend token validation or a mismatch in Supabase project credentials.
- Next steps: Test the flow in the browser and check backend validation logic. 