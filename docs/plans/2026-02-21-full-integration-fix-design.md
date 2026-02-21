# Full Integration Fix Design - Grocery20

**Date:** 2026-02-21
**Goal:** Fix every broken connection between database schema, backend controllers, frontend services, and UI pages so the entire app works end-to-end.

---

## Problem Summary

The app was built by parallel agents that created mismatched pieces. There are 8 schema/table mismatches, 6 endpoint path mismatches, 7+ duplicate axios instances, and a broken import. The backend is ~35% functional; the frontend pages exist but can't complete real operations.

---

## Fix Strategy

Work bottom-up: fix the database first, then align controllers, then fix frontend services, then verify each page works.

---

## Phase 1: Database Schema Alignment

Create a single migration that adds all missing tables and fixes all mismatches.

**Missing tables to CREATE:**
1. `refresh_tokens` (user_id, token, created_at, expires_at)
2. `recipe_ingredients` (id, recipe_id, ingredient_name, quantity, unit, order_index)
3. `meal_plan_meals` (id, meal_plan_id, recipe_id, day_of_week, meal_type, servings, notes)
4. `store_products` (id, store_name, product_name, price, unit, category, last_updated)

**Tables to RENAME/ALTER:**
5. `budgets` columns: rename `amount`->`budget_allocated`, `spent`->`amount_spent`, `start_date`->`week_start`, `end_date`->`week_end` (OR update controllers to use existing names - controller update is safer)
6. `inventory` rename to `inventory_items` (OR update controllers - controller update is safer)
7. `preferences` vs `dietary_preferences` - controllers expect `dietary_preferences` with columns `preference_type`, `item`, `severity`

**Decision:** Update controllers to match the existing schema wherever possible. Only create genuinely missing tables. This avoids data loss and is safer than renaming tables.

---

## Phase 2: Backend Controller Fixes

### 2a. Auth Controller
- Create `refresh_tokens` table (this one genuinely doesn't exist)
- No controller changes needed - auth is correct, just needs the table

### 2b. Budget Controller
- Update all references from `budget_tracking` to `budgets`
- Update column names: `budget_allocated`->`amount`, `amount_spent`->`spent`, `week_start`->`start_date`, `week_end`->`end_date`

### 2c. Inventory Controller
- Update all references from `inventory_items` to `inventory`
- Verify column names match schema

### 2d. Households Controller
- Update dietary preferences queries to use `preferences` table with correct column names
- Or create `dietary_preferences` table if structure is fundamentally different

### 2e. Meal Plans Controller
- Create `meal_plan_meals` table (genuinely needed - `meals` table has different purpose)
- Verify controller queries match new table structure

### 2f. Recipes Controller
- Create `recipe_ingredients` table
- The `ingredients` table references can use inline ingredient_name in recipe_ingredients (no separate ingredients table needed)

### 2g. Shopping Controller
- Fix `from-meal-plan` endpoint to query correct tables after meal_plan_meals and recipe_ingredients exist

### 2h. Stores Controller
- Create `store_products` table for price comparison feature

---

## Phase 3: Frontend Service Consolidation

### 3a. Consolidate all services to use centralized `apiClient.ts`
Remove duplicate axios instances from: authService, aiService, householdService, mealPlanService, recipeService, shoppingListService, inventoryService, nutritionService, storeService, budgetService

Each service should import and use the centralized apiClient which already has:
- Base URL configuration
- Auth token interceptor
- Automatic 401 token refresh
- Consistent error handling

### 3b. Fix endpoint path mismatches
- aiService: `/ai/generate-meal-plan` -> `/ai/meal-plan`
- recipeService: `/recipes/{id}/rate` -> `/recipes/{id}/ratings`
- recipeService: `/recipes/{id}/ratings/me` -> `/recipes/{id}/ratings/my-rating`
- recipeService: DELETE `/recipes/{id}/ratings/me` -> DELETE `/recipes/{id}/ratings`
- nutritionService: query param `?date=X` -> path param `/day/X`
- nutritionService: `/nutrition/meal-plan/{id}/compare` -> `/nutrition/compare-goals`
- inventoryService: PATCH `mark-expired` -> POST `mark-expired`

### 3c. Fix type definitions
- authService refreshToken return type: add `refreshToken` field

---

## Phase 4: Frontend Page Fixes

### 4a. BudgetPage.tsx
- Fix broken import: `../store/store` -> `../features/store`

### 4b. ChatPage.tsx
- Wire up real contextual data (TODO items on lines 44-48, 509-514)

### 4c. DashboardPage.tsx
- Wire up real household data for contextual prompts

---

## Phase 5: Verification

- Test each API endpoint against real database
- Test each frontend page completes its primary function
- Verify auth flow: register -> login -> token refresh -> protected routes
- Verify core flow: chat -> meal plan -> shopping list
- Verify secondary flows: budget, inventory, household management, recipes

---

## Out of Scope (working but non-critical)

- Kroger API integration (depends on API keys)
- Push notifications (depends on VAPID keys)
- Image service Unsplash integration (works but key in frontend)
- Vision API (camera scanning - hardware dependent)
- E2E tests (existing, can run after fixes)
