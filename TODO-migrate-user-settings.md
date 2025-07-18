# TODO: Migrate All User Settings to `user_settings` Table

This document outlines the steps to migrate all user settings—including LLM model parameters—to the `user_settings` table, using the following JSON structure for the `settings` column:

```json
{
  "flows": [],
  "activeFlowId": "",
  "modelParameters": {},
  "mcp": {
    "servers": [],
    "preRegistered": []
  }
}
```

---

## 1. Schema & Data Migration

- [x] **(Optional)** Migrate any existing model parameter data from `llm_model_parameters` into the `modelParameters` key in the `settings` JSONB column of `user_settings` for each user.
- [x] **(Optional)** Remove or deprecate the `llm_model_parameters` table if it is no longer needed.

---

## 2. Backend/API Changes

- [x] **Update API Endpoints**  
  Refactor all endpoints that read/write LLM model parameters to use the `user_settings.settings` column, specifically the `modelParameters` key.
- [x] **Unify Settings Structure**  
  Ensure all user settings (flows, activeFlowId, modelParameters, mcp, etc.) are stored in the unified JSON structure.
- [x] **Update Database Access Code**  
  Refactor all ORM/SQL queries to use `user_settings.settings` for all user settings, including model parameters.
- [x] **Validation**  
  Add validation to ensure the `settings` JSON always contains the required keys (at least as empty objects/arrays/strings).

---

## 3. Frontend Changes

- [x] **Update API Calls**  
  Refactor frontend code to call the new/updated endpoints for user settings, removing any direct calls to endpoints that used `llm_model_parameters`.
- [x] **Update Data Access**  
  Update code that reads model parameters to access them from `settings.modelParameters`.
  ```ts
  const modelParams = settings?.modelParameters ?? {};
  ```
- [x] **Update Save Logic**  
  When saving model parameters, update the `modelParameters` key in the settings object and send the whole object to the backend.
- [x] **Add Defensive Checks**  
  Ensure the frontend handles missing keys gracefully by providing sensible defaults.

---

## 4. Testing

- [x] **Unit & Integration Tests**  
  Update or add tests to ensure settings are correctly read from and written to the `user_settings` table, especially for the `modelParameters` key.
- [x] **Manual Testing**  
  Verify that the settings page (including the models tab) works as expected for new and existing users.

---

## 5. Cleanup

- [x] **Remove Old Code**  
  Delete or deprecate any code, endpoints, or database access related to `llm_model_parameters`.
- [x] **Update Documentation**  
  Update any relevant documentation to reflect the new unified settings storage.

---

## Example Backend Access (Python/SQLAlchemy)

```python
# Fetch settings
settings = db.query(UserSettings).filter_by(user_id=user_id).first().settings
model_params = settings.get("modelParameters", {})
```

## Example Frontend Access (TypeScript)

```ts
const modelParams = settings?.modelParameters ?? {};
```

---

**Note:**
- The `settings` JSONB should always include at least the keys: `flows`, `activeFlowId`, `modelParameters`, and `mcp` (with their respective default values).
- All user settings should be read from and written to this unified structure going forward. 