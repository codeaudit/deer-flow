# TODO: Migrate Away from localStorage for Settings Management (with SQLAlchemy & Supabase)

## 1. Decide on the New Source of Truth
- [x] **Persist settings in a database using SQLAlchemy (PostgreSQL)**
  - [x] SQLAlchemy is present in the backend stack (`src/backend/database/`)
- [x] **Sync and expose settings via Supabase for cloud access and multi-device support**
  - [x] Supabase is present in the project (`web/src/lib/supabase/`)

## 2. Design/Update Backend API (SQLAlchemy + Supabase)
- [x] Define SQLAlchemy models for user/account settings (e.g., `UserSettings` table)
  - [x] Create a `UserSettings` model in `src/backend/database/models.py` (or similar)
  - [x] Add fields for user_id/account_id, settings (JSON), timestamps, etc.
- [x] Implement CRUD operations for settings using SQLAlchemy ORM
  - [x] Add functions to create, read, update, and delete settings in the database
- [x] Expose REST or GraphQL endpoints for:
  - [x] Fetching user/account settings from the database
  - [x] Updating user/account settings in the database
  - [ ] (Optional) Resetting settings to defaults
- [x] Integrate Supabase as the cloud backend for storage and API
  - [x] Supabase client/server setup exists in `web/src/lib/supabase/`
  - [x] Connect backend endpoints to Supabase (or use Supabase's PostgREST directly)
- [x] Ensure authentication and authorization for settings endpoints
  - [x] Use Supabase Auth or your own auth system to secure settings endpoints

## 3. Refactor Frontend State Management
- [x] Remove all direct usage of `localStorage` in `web/src/core/store/settings-store.ts` and related files
  - [x] Delete or refactor `loadSettings` and `saveSettings` to use API calls
- [x] Replace `loadSettings` and `saveSettings` logic with:
  - [x] **On app load:** Fetch settings from Supabase API and hydrate Zustand store
  - [x] **On settings change:** Send updates to Supabase API and update Zustand store
- [x] Ensure all settings access goes through the Zustand store, which is hydrated from the backend

## 4. Update Zustand Store Initialization
- [x] On first load, initialize the store with a loading state
- [x] After fetching from Supabase, populate the store with the fetched settings
- [x] Provide sensible defaults if the backend returns nothing

## 5. Update All Settings Consumers
- [x] Refactor all components/hooks that depend on settings to:
  - [x] Use the Zustand store only (never localStorage)
  - [x] Handle loading states gracefully (e.g., show spinners/placeholders if settings are not yet loaded)

## 6. Handle Account Switching
- [x] If your app supports multiple accounts, ensure switching accounts triggers a fresh fetch from Supabase and updates the store accordingly

## 7. Remove/Deprecate Migration Logic
- [x] Remove or refactor any code that migrates or patches localStorage-based settings
- [x] Optionally, provide a one-time migration script to move localStorage settings to the database via Supabase for existing users

## 8. Testing
- [x] Test the new flow for:
  - [x] First-time users (no settings)
  - [x] Returning users (with old localStorage settings, if migration is needed)
  - [x] Settings updates and persistence across reloads/devices
  - [x] Error handling (backend/Supabase unavailable, etc.)

## 9. Cleanup
- [x] Remove all unused localStorage-related code
- [x] Update documentation to reflect the new settings management approach (SQLAlchemy + Supabase)

---

**Optional:**
- [ ] Add optimistic UI updates for settings changes (update UI before backend/Supabase confirms)
- [ ] Add versioning to settings in the database for future migrations

---

**Summary:**
This plan will ensure your settings are always consistent, available across devices, and robust against localStorage corruption or browser limitations. By using SQLAlchemy for backend storage and Supabase for cloud sync and API, you gain reliability, scalability, and multi-device support. It will also fix the MCP tab error by guaranteeing settings are always loaded from a single, reliable source. 