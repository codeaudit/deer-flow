# TODO: Refactor to Single FastAPI App (Best Practice)

## Goal
Refactor the project to use a single FastAPI app where all middleware (CORS, Auth, etc.) and all routes are registered directly, following best practices for maintainability and correctness.

---

## Action Plan

### 1. Consolidate App Definition
- [x] Choose a single file for the main FastAPI app (e.g., `src/server/app.py`).
- [x] Remove any secondary app definitions (e.g., in `main.py`) unless needed for CLI entrypoint.

### 2. Register All Middleware on the Main App
- [x] In `src/server/app.py`, add all middleware directly to the `app` instance:
  - [x] CORS middleware
  - [x] AuthMiddleware (and any others)
- [x] Remove middleware setup from any parent or mounting app.

### 3. Register All Routes on the Main App
- [x] Ensure all API routes are registered directly on the main `app` instance in `src/server/app.py`.
- [x] Remove any use of `app.mount()` for sub-apps unless absolutely necessary.

### 4. Remove Sub-App Mounting
- [x] Delete or refactor `src/main.py` so it does not create a parent app or mount the API app.
- [x] If a CLI entrypoint is needed, it should import and run the main app directly.

### 5. Update Startup Scripts
- [x] Update `bootstrap.sh` and any deployment scripts to start the app with:
  ```sh
  uvicorn src.server.app:app
  ```
- [x] Remove references to `src.main:app` or other entrypoints.

### 6. Test Authentication and All Endpoints
- [ ] Verify that authentication works (401s when not logged in, 200s when logged in).
- [ ] Test all endpoints (e.g., `/api/settings`, `/api/models`, etc.) for correct behavior.
- [ ] Check that CORS and other middleware are functioning as expected.

### 7. Clean Up
- [ ] Remove any unused files or code related to the old multi-app structure.
- [ ] Update documentation to reflect the new single-app structure.

---

## Notes
- This structure is simpler, easier to maintain, and avoids subtle bugs with middleware and sub-apps.
- Only use sub-app mounting if you have a strong architectural reason (e.g., integrating a third-party app).

---

**After completing these steps, your FastAPI project will follow best practices for middleware and route registration!** 