# TODO: Migrate Model Parameters Storage to Backend

## Background
Currently, the DeerFlow frontend stores per-model generation parameters (temperature, max_tokens, top_p, frequency_penalty) in the browser's localStorage as part of the user's account settings. This approach has several limitations:
- Model parameters are not portable between devices or browsers.
- Clearing browser data or using a different device resets all customizations.
- No centralized management or backup.

## Current Flow (localStorage)
1. **Initialization**: On app load, the frontend loads settings (including model parameters) from localStorage.
2. **Usage**: When a user opens the Models tab, the frontend reads model parameters from the in-memory store (hydrated from localStorage).
3. **Update**: When a user changes a parameter, the new value is written to the in-memory store and persisted to localStorage.
4. **Persistence**: All changes are local to the browser; no backend API is involved for model parameters.

## Target Flow (Backend Storage)
1. **Initialization**: On app load, the frontend fetches model parameters for the current user/account from the backend via an API endpoint.
2. **Usage**: The frontend uses the fetched parameters for display and editing in the Models tab.
3. **Update**: When a user changes a parameter, the frontend sends an API request to update the parameter(s) in the backend.
4. **Persistence**: All changes are stored in the backend database (e.g., via SQLAlchemy), and are portable across devices and browsers.

---

## Action Plan

### 1. **Backend: API Design & Implementation**
- [x] **Design REST API endpoints** for model parameter CRUD operations:
    - `GET /api/model-parameters` — List all model parameters for the current user/account
    - `GET /api/model-parameters/{model_id}` — Get parameters for a specific model
    - `POST /api/model-parameters/{model_id}` — Create or update parameters for a model
    - `DELETE /api/model-parameters/{model_id}` — Reset parameters for a model
- [x] **Implement endpoints** in the backend (FastAPI):
    - Use authentication to associate parameters with the current user/account
    - Store parameters in a new or existing table (e.g., `llm_model_parameters`)
    - Ensure endpoints return/accept the same parameter structure as the frontend expects
- [x] **Add migration** for the new table if needed
- [x] **Add tests** for the new endpoints

### 2. **Frontend: API Integration**
- [x] **Remove all localStorage logic** for model parameters from the settings store
- [x] **On app load**, fetch all model parameters for the current user/account from the backend and hydrate the in-memory store
- [x] **On parameter change**, send an API request to update the backend, and update the in-memory store on success
- [x] **On parameter reset**, send a DELETE request to the backend, and update the in-memory store on success
- [x] **Update error handling** to handle API failures gracefully
- [x] **Update tests** to cover the new API-driven flow

### 3. **Migration & Compatibility**
- [ ] **On first load after deployment**, migrate any existing localStorage parameters to the backend (optional, for smoother UX)
- [ ] **Document the migration** for users (e.g., in the release notes)

### 4. **Documentation**
- [x] **Update developer docs** to describe the new flow
- [x] **Update API docs** with the new endpoints

---

## Summary Table
| Step | Task | Owner |
|------|------|-------|
| 1    | Backend API endpoints | Backend Dev |
| 2    | Backend DB migration  | Backend Dev |
| 3    | Frontend API integration | Frontend Dev |
| 4    | Remove localStorage logic | Frontend Dev |
| 5    | Migration script (optional) | Fullstack |
| 6    | Documentation | Docs |

---

## Notes
- Ensure all API endpoints are authenticated and scoped to the current user/account.
- Consider batching parameter updates for efficiency.
- Ensure the API returns the full parameter set after any update for consistency.
- Test thoroughly for race conditions and offline scenarios. 

## TODO: Fix modelParameters Store Structure Bug

There is a structural inconsistency between the frontend store and the API-driven model parameter logic. To resolve the error and ensure robust model parameter management, do the following:

- [ ] Update `getModelParameters` to access `modelParameters` from the correct path: `accountSettings[accountId].modelParameters`.
- [ ] Update `loadModelParameters` to set model parameters inside the current account's settings (not at the top level of the store).
- [ ] Update `setModelParameters` to update model parameters inside the current account's settings (not at the top level of the store).
- [ ] Update `resetModelParameters` to remove model parameters from the current account's settings (not at the top level of the store).
- [ ] Ensure all usages of model parameters in the frontend are consistent with the nested structure.
- [ ] Test thoroughly to confirm the error is resolved and model parameter persistence works as expected. 