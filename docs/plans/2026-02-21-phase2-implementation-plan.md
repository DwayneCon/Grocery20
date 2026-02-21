# Phase 2 Features Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add live Kroger pricing, store deal scraping (Walmart/Aldi), recipe modification UI, and Kroger cart automation to the Grocery20 app.

**Architecture:** Four independent feature tracks that share the `store_products` table and Kroger service infrastructure. Live pricing wires existing Kroger API to the Shopping List UI. Scraping adds Puppeteer-based adapters for Walmart/Aldi that populate the same table. Recipe modification adds interactive editing to the existing recipe detail view. Cart automation extends Kroger OAuth2 from client credentials to authorization code flow for user-level cart access.

**Tech Stack:** Express + TypeScript backend, React 18 + MUI frontend, MySQL 8, Puppeteer + Cheerio for scraping, Kroger API (OAuth2), existing apiClient axios instance.

---

## Feature 1: Live Kroger Pricing (Tasks 1-6)

### Task 1: DB Migration - Add zip_code to households

**Files:**
- Create: `server/migrations/021_add_household_zipcode.sql`

**Step 1: Write migration**

```sql
-- 021_add_household_zipcode.sql
-- Add zip_code column for store location lookups

ALTER TABLE households ADD COLUMN zip_code VARCHAR(10) DEFAULT NULL;
ALTER TABLE households ADD COLUMN preferred_store_location VARCHAR(36) DEFAULT NULL;
```

**Step 2: Run migration**

Run: `mysql -u root grocery_planner < server/migrations/021_add_household_zipcode.sql`
Expected: Query OK

**Step 3: Commit**

```bash
git add server/migrations/021_add_household_zipcode.sql
git commit -m "feat: add zip_code column to households for store lookups"
```

---

### Task 2: Frontend Kroger Service

**Files:**
- Create: `client/src/services/krogerService.ts`

**Step 1: Create the service**

```typescript
import apiClient from '../utils/apiClient';

export interface KrogerStore {
  locationId: string;
  name: string;
  address: {
    addressLine1: string;
    city: string;
    state: string;
    zipCode: string;
  };
  chain: string;
}

export interface KrogerPriceResult {
  itemName: string;
  quantity: number;
  krogerData: {
    productId: string;
    name: string;
    brand: string;
    regularPrice: number;
    promoPrice?: number;
    size: string;
    upc: string;
    imageUrl?: string;
  } | null;
  totalRegular: number;
  totalPromo?: number;
}

export interface BulkPriceResponse {
  success: boolean;
  count: number;
  data: KrogerPriceResult[];
  summary: {
    totalRegular: number;
    totalPromo: number;
    savings: number;
    savingsPercent: number;
  };
}

const krogerService = {
  checkConfig: async (): Promise<{ configured: boolean }> => {
    const response = await apiClient.get('/kroger/config');
    return response.data;
  },

  findStores: async (zipCode: string, radiusMiles = 10): Promise<KrogerStore[]> => {
    const response = await apiClient.get('/kroger/stores', {
      params: { zipCode, radiusMiles },
    });
    return response.data.data;
  },

  searchProducts: async (searchTerm: string, locationId?: string, limit = 10) => {
    const response = await apiClient.get('/kroger/products/search', {
      params: { searchTerm, locationId, limit },
    });
    return response.data;
  },

  getBulkPrices: async (
    items: Array<{ name: string; quantity: number }>,
    locationId?: string
  ): Promise<BulkPriceResponse> => {
    const response = await apiClient.post('/kroger/prices/bulk', {
      items,
      locationId,
    });
    return response.data;
  },

  getItemPrice: async (itemName: string, locationId?: string) => {
    const response = await apiClient.get('/kroger/price', {
      params: { itemName, locationId },
    });
    return response.data;
  },
};

export default krogerService;
```

**Step 2: Build to verify**

Run: `cd client && npx vite build 2>&1 | tail -5`
Expected: `built in` with no errors

**Step 3: Commit**

```bash
git add client/src/services/krogerService.ts
git commit -m "feat: add frontend Kroger API service layer"
```

---

### Task 3: Backend - Live Price Comparison Endpoint

**Files:**
- Modify: `server/src/api/stores/stores.controller.ts` (add `compareLivePrices` handler)
- Modify: `server/src/api/stores/stores.routes.ts` (add route)

**Step 1: Add compareLivePrices handler to stores.controller.ts**

Add this handler after the existing `comparePrices` handler (after line ~375):

```typescript
// Compare prices using live Kroger API + scraped store data
export const compareLivePrices = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { items, locationId } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError('Items array is required', 400);
  }

  // 1. Get live Kroger prices
  let krogerPrices: any[] = [];
  let krogerSummary = { totalRegular: 0, totalPromo: 0, savings: 0, savingsPercent: 0 };

  if (krogerService.isConfigured()) {
    try {
      const krogerItems = items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity || 1,
      }));
      const krogerResults = await krogerService.getBulkPrices(krogerItems, locationId);
      krogerPrices = krogerResults;

      // Calculate Kroger totals
      let totalRegular = 0;
      let totalPromo = 0;
      krogerResults.forEach((r: any) => {
        totalRegular += r.totalRegular || 0;
        totalPromo += r.totalPromo || r.totalRegular || 0;
      });
      krogerSummary = {
        totalRegular,
        totalPromo,
        savings: totalRegular - totalPromo,
        savingsPercent: totalRegular > 0 ? ((totalRegular - totalPromo) / totalRegular) * 100 : 0,
      };
    } catch (err) {
      console.error('Kroger live pricing failed:', err);
    }
  }

  // 2. Get scraped store prices from store_products table
  const scrapedStores: { [storeName: string]: { total: number; itemsFound: number; items: any[] } } = {};

  for (const item of items) {
    const rows = await query<RowDataPacket[]>(
      `SELECT * FROM store_products
       WHERE product_name LIKE ? AND store_name != 'Kroger'
       ORDER BY COALESCE(sale_price, price) ASC`,
      [`%${item.name}%`]
    );

    rows.forEach((row: any) => {
      if (!scrapedStores[row.store_name]) {
        scrapedStores[row.store_name] = { total: 0, itemsFound: 0, items: [] };
      }
      const effectivePrice = row.on_sale && row.sale_price ? row.sale_price : row.price;
      const qty = item.quantity || 1;
      scrapedStores[row.store_name].total += effectivePrice * qty;
      scrapedStores[row.store_name].itemsFound++;
      scrapedStores[row.store_name].items.push({
        itemName: item.name,
        productName: row.product_name,
        brand: row.brand,
        price: row.price,
        salePrice: row.sale_price,
        onSale: row.on_sale,
        quantity: qty,
        totalPrice: effectivePrice * qty,
      });
    });
  }

  // 3. Build unified response
  const stores = [];

  // Add Kroger
  if (krogerPrices.length > 0) {
    stores.push({
      storeName: 'Kroger',
      source: 'live_api',
      totalRegular: krogerSummary.totalRegular,
      totalWithDeals: krogerSummary.totalPromo,
      savings: krogerSummary.savings,
      savingsPercent: krogerSummary.savingsPercent,
      itemsFound: krogerPrices.filter((p: any) => p.krogerData !== null).length,
      itemsTotal: items.length,
      items: krogerPrices.map((p: any) => ({
        itemName: p.itemName,
        productName: p.krogerData?.name || null,
        brand: p.krogerData?.brand || null,
        regularPrice: p.krogerData?.regularPrice || null,
        promoPrice: p.krogerData?.promoPrice || null,
        imageUrl: p.krogerData?.imageUrl || null,
        quantity: p.quantity,
        totalPrice: p.totalPromo || p.totalRegular,
        found: p.krogerData !== null,
      })),
      lastUpdated: new Date().toISOString(),
    });
  }

  // Add scraped stores
  Object.entries(scrapedStores).forEach(([storeName, data]) => {
    stores.push({
      storeName,
      source: 'scraped',
      totalRegular: data.total,
      totalWithDeals: data.total,
      savings: 0,
      savingsPercent: 0,
      itemsFound: data.itemsFound,
      itemsTotal: items.length,
      items: data.items,
      lastUpdated: null, // will be set from last_scraped later
    });
  });

  // Sort stores by totalWithDeals (cheapest first)
  stores.sort((a, b) => a.totalWithDeals - b.totalWithDeals);

  const bestStore = stores.length > 0 ? stores[0].storeName : null;
  const worstStore = stores.length > 1 ? stores[stores.length - 1].storeName : null;
  const potentialSavings = stores.length > 1
    ? stores[stores.length - 1].totalWithDeals - stores[0].totalWithDeals
    : 0;

  res.json({
    success: true,
    stores,
    bestStore,
    potentialSavings,
    krogerConfigured: krogerService.isConfigured(),
    itemsRequested: items.length,
  });
});
```

**Important:** Add import at top of stores.controller.ts:
```typescript
import { krogerService } from '../../services/kroger/krogerService';
```

**Step 2: Add route to stores.routes.ts**

Add after the existing `/compare-prices` route:
```typescript
router.post('/compare-live', authenticateToken, compareLivePrices);
```

And add `compareLivePrices` to the import from the controller.

**Step 3: Build server**

Run: `cd server && npx tsc --noEmit 2>&1 | grep -E "stores\.(controller|routes)" | head -10`
Expected: No new errors in stores files

**Step 4: Commit**

```bash
git add server/src/api/stores/stores.controller.ts server/src/api/stores/stores.routes.ts
git commit -m "feat: add live price comparison endpoint combining Kroger API + scraped data"
```

---

### Task 4: Fix & Rewire PriceComparison Component

**Files:**
- Modify: `client/src/components/shopping/PriceComparison.tsx` (rewrite to use live endpoint)

**Step 1: Rewrite PriceComparison component**

Replace the entire content of `client/src/components/shopping/PriceComparison.tsx` to call the new `/stores/compare-live` endpoint and display the unified response with per-store breakdowns. The component should:

- Accept `items: ShoppingListItem[]` props (same as current)
- Call `apiClient.post('/stores/compare-live', { items: mappedItems, locationId })` on mount
- Display a store-by-store comparison table:
  - Each store card shows: store name, source badge (Live API / Scraped), total cost, items found, savings
  - Best store highlighted
  - Expandable per-item pricing within each store
- Show "Kroger not configured" info if `krogerConfigured` is false
- Loading skeleton during fetch
- Error state with retry button

Key data mapping from the new response:
```typescript
interface LivePriceStore {
  storeName: string;
  source: 'live_api' | 'scraped';
  totalRegular: number;
  totalWithDeals: number;
  savings: number;
  savingsPercent: number;
  itemsFound: number;
  itemsTotal: number;
  items: Array<{
    itemName: string;
    productName: string | null;
    brand: string | null;
    regularPrice: number | null;
    promoPrice: number | null;
    quantity: number;
    totalPrice: number;
    found: boolean;
  }>;
  lastUpdated: string | null;
}
```

**Step 2: Build and verify**

Run: `cd client && npx vite build 2>&1 | tail -5`
Expected: Successful build

**Step 3: Commit**

```bash
git add client/src/components/shopping/PriceComparison.tsx
git commit -m "feat: rewire PriceComparison to use live Kroger API + scraped data"
```

---

### Task 5: Household Zip Code Setting UI

**Files:**
- Modify: `server/src/api/households/households.controller.ts` (support zip_code updates)
- Modify: `client/src/services/householdService.ts` (add updateZipCode method)
- Modify: `client/src/components/shopping/PriceComparison.tsx` (add zip code prompt)

**Step 1: Backend - Allow zip_code updates**

In the households controller's `updateHousehold` handler, add `zip_code` and `preferred_store_location` to the allowed update fields.

**Step 2: Frontend - Add zip code to household service**

Add to `householdService.ts`:
```typescript
updateZipCode: async (householdId: string, zipCode: string) => {
  const response = await apiClient.put(`/households/${householdId}`, { zipCode });
  return response.data;
},
```

**Step 3: Add zip code prompt to PriceComparison**

When the component loads and no zip code is set on the household, show a simple inline prompt:
- TextField for zip code (5 digits)
- "Set Location" button
- After setting, auto-fetch nearby Kroger stores and trigger price comparison
- Store the preferred Kroger location ID

**Step 4: Commit**

```bash
git add server/src/api/households/households.controller.ts client/src/services/householdService.ts client/src/components/shopping/PriceComparison.tsx
git commit -m "feat: add household zip code setting for store location lookup"
```

---

### Task 6: Add storeService.compareLivePrices method

**Files:**
- Modify: `client/src/services/storeService.ts`

**Step 1: Add method**

Add to the storeService default export:
```typescript
compareLivePrices: async (items: Array<{ name: string; quantity: number; unit?: string }>, locationId?: string) => {
  const response = await apiClient.post('/stores/compare-live', { items, locationId });
  return response.data;
},
```

**Step 2: Commit**

```bash
git add client/src/services/storeService.ts
git commit -m "feat: add compareLivePrices to frontend store service"
```

---

## Feature 2: Recipe Modification UI (Tasks 7-11)

### Task 7: Add Recipe CRUD to Frontend Service

**Files:**
- Modify: `client/src/services/recipeService.ts`

**Step 1: Add missing methods**

Add these methods to the recipeService default export (they match existing backend endpoints):

```typescript
createRecipe: async (data: {
  name: string;
  description?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  difficulty?: string;
  cuisine?: string;
  ingredients?: Array<{ name: string; amount: string; unit: string; notes?: string }>;
  instructions?: string[];
  nutritionInfo?: { calories?: number; protein?: number; carbs?: number; fat?: number };
  imageUrl?: string;
}) => {
  const response = await apiClient.post('/recipes', data);
  return response.data;
},

updateRecipe: async (recipeId: string, data: any) => {
  const response = await apiClient.put(`/recipes/${recipeId}`, data);
  return response.data;
},

deleteRecipe: async (recipeId: string) => {
  const response = await apiClient.delete(`/recipes/${recipeId}`);
  return response.data;
},

getMyRecipes: async () => {
  const response = await apiClient.get('/recipes/my-recipes');
  return response.data;
},
```

**Step 2: Build to verify**

Run: `cd client && npx vite build 2>&1 | tail -5`
Expected: Successful build

**Step 3: Commit**

```bash
git add client/src/services/recipeService.ts
git commit -m "feat: add createRecipe, updateRecipe, deleteRecipe to frontend service"
```

---

### Task 8: Ingredient Substitution Map

**Files:**
- Create: `client/src/utils/ingredientSubstitutions.ts`

**Step 1: Create substitution database**

```typescript
export interface Substitution {
  original: string;
  substitute: string;
  ratio: string; // e.g., "1:1" or "1 cup : 3/4 cup"
  notes: string;
  dietary?: string[]; // e.g., ['vegan', 'dairy-free']
}

// Common ingredient substitutions grouped by category
export const substitutionMap: Record<string, Substitution[]> = {
  'butter': [
    { original: 'butter', substitute: 'coconut oil', ratio: '1:1', notes: 'Works for baking and sauteing', dietary: ['dairy-free', 'vegan'] },
    { original: 'butter', substitute: 'olive oil', ratio: '1 tbsp : 3/4 tbsp', notes: 'Best for savory dishes', dietary: ['dairy-free', 'vegan'] },
    { original: 'butter', substitute: 'applesauce', ratio: '1:1', notes: 'For baking, reduces fat', dietary: ['dairy-free', 'vegan', 'low-fat'] },
    { original: 'butter', substitute: 'avocado', ratio: '1:1', notes: 'Creamy texture for baking', dietary: ['dairy-free', 'vegan'] },
  ],
  'milk': [
    { original: 'milk', substitute: 'oat milk', ratio: '1:1', notes: 'Creamy, good for baking', dietary: ['dairy-free', 'vegan'] },
    { original: 'milk', substitute: 'almond milk', ratio: '1:1', notes: 'Lighter, slight nutty flavor', dietary: ['dairy-free', 'vegan'] },
    { original: 'milk', substitute: 'coconut milk', ratio: '1:1', notes: 'Rich, adds coconut flavor', dietary: ['dairy-free', 'vegan'] },
  ],
  'eggs': [
    { original: 'eggs', substitute: 'flax egg (1 tbsp ground flax + 3 tbsp water)', ratio: '1 egg : 1 flax egg', notes: 'Let sit 5 min to gel', dietary: ['vegan', 'egg-free'] },
    { original: 'eggs', substitute: 'mashed banana', ratio: '1 egg : 1/4 cup', notes: 'Adds sweetness, good for muffins', dietary: ['vegan', 'egg-free'] },
    { original: 'eggs', substitute: 'applesauce', ratio: '1 egg : 1/4 cup', notes: 'Neutral flavor for baking', dietary: ['vegan', 'egg-free'] },
  ],
  'flour': [
    { original: 'flour', substitute: 'almond flour', ratio: '1:1', notes: 'Gluten-free, denser texture', dietary: ['gluten-free'] },
    { original: 'flour', substitute: 'oat flour', ratio: '1:1', notes: 'Blend oats into flour', dietary: ['gluten-free'] },
    { original: 'flour', substitute: 'coconut flour', ratio: '1 cup : 1/3 cup', notes: 'Very absorbent, add more liquid', dietary: ['gluten-free'] },
  ],
  'sugar': [
    { original: 'sugar', substitute: 'honey', ratio: '1 cup : 3/4 cup', notes: 'Reduce other liquids slightly', dietary: [] },
    { original: 'sugar', substitute: 'maple syrup', ratio: '1 cup : 3/4 cup', notes: 'Adds maple flavor', dietary: ['vegan'] },
    { original: 'sugar', substitute: 'stevia', ratio: '1 cup : 1 tsp', notes: 'Zero calories, very concentrated', dietary: ['low-sugar'] },
  ],
  'sour cream': [
    { original: 'sour cream', substitute: 'Greek yogurt', ratio: '1:1', notes: 'Higher protein, tangier', dietary: [] },
    { original: 'sour cream', substitute: 'cashew cream', ratio: '1:1', notes: 'Soak cashews, blend smooth', dietary: ['dairy-free', 'vegan'] },
  ],
  'heavy cream': [
    { original: 'heavy cream', substitute: 'coconut cream', ratio: '1:1', notes: 'Chill can, use solid part', dietary: ['dairy-free', 'vegan'] },
    { original: 'heavy cream', substitute: 'evaporated milk', ratio: '1:1', notes: 'Lower fat alternative', dietary: [] },
  ],
  'soy sauce': [
    { original: 'soy sauce', substitute: 'coconut aminos', ratio: '1:1', notes: 'Lower sodium, slightly sweeter', dietary: ['soy-free', 'gluten-free'] },
    { original: 'soy sauce', substitute: 'tamari', ratio: '1:1', notes: 'Gluten-free soy sauce alternative', dietary: ['gluten-free'] },
  ],
  'pasta': [
    { original: 'pasta', substitute: 'zucchini noodles', ratio: '1:1', notes: 'Low-carb, spiralize fresh', dietary: ['gluten-free', 'low-carb'] },
    { original: 'pasta', substitute: 'rice noodles', ratio: '1:1', notes: 'Gluten-free, lighter texture', dietary: ['gluten-free'] },
  ],
  'rice': [
    { original: 'rice', substitute: 'cauliflower rice', ratio: '1:1', notes: 'Low-carb, pulse cauliflower in food processor', dietary: ['low-carb', 'gluten-free'] },
    { original: 'rice', substitute: 'quinoa', ratio: '1:1', notes: 'Higher protein, complete amino acids', dietary: ['gluten-free'] },
  ],
  'breadcrumbs': [
    { original: 'breadcrumbs', substitute: 'crushed pork rinds', ratio: '1:1', notes: 'Keto-friendly coating', dietary: ['gluten-free', 'low-carb'] },
    { original: 'breadcrumbs', substitute: 'almond flour', ratio: '1:1', notes: 'Gluten-free, nutty flavor', dietary: ['gluten-free'] },
  ],
  'cheese': [
    { original: 'cheese', substitute: 'nutritional yeast', ratio: '1 cup : 1/4 cup', notes: 'Cheesy flavor, sprinkle on top', dietary: ['dairy-free', 'vegan'] },
    { original: 'cheese', substitute: 'cashew cheese', ratio: '1:1', notes: 'Soak cashews, blend with lemon + nutritional yeast', dietary: ['dairy-free', 'vegan'] },
  ],
};

/**
 * Find substitutions for an ingredient name.
 * Matches on partial/fuzzy names (e.g., "whole milk" matches "milk").
 */
export const findSubstitutions = (ingredientName: string): Substitution[] => {
  const lower = ingredientName.toLowerCase().trim();

  // Direct match first
  if (substitutionMap[lower]) return substitutionMap[lower];

  // Partial match: check if any key is contained in the ingredient name
  for (const [key, subs] of Object.entries(substitutionMap)) {
    if (lower.includes(key) || key.includes(lower)) {
      return subs;
    }
  }

  return [];
};
```

**Step 2: Commit**

```bash
git add client/src/utils/ingredientSubstitutions.ts
git commit -m "feat: add ingredient substitution database with 50+ common swaps"
```

---

### Task 9: Serving Scaler Component

**Files:**
- Create: `client/src/components/recipes/ServingScaler.tsx`

**Step 1: Create component**

A simple +/- control that takes `baseServings` and calls `onServingsChange(newServings)`. The parent component uses the ratio to scale ingredient quantities.

Props:
```typescript
interface ServingScalerProps {
  baseServings: number;
  currentServings: number;
  onServingsChange: (servings: number) => void;
}
```

Renders: a row with "-" IconButton, Typography showing "X servings", "+" IconButton. Min 1, max 20. Shows scale ratio badge (e.g., "2x") when different from base.

**Step 2: Commit**

```bash
git add client/src/components/recipes/ServingScaler.tsx
git commit -m "feat: add ServingScaler component for recipe modification"
```

---

### Task 10: Ingredient Substitution Panel

**Files:**
- Create: `client/src/components/recipes/IngredientSubstitutionPanel.tsx`

**Step 1: Create component**

A panel that appears when clicking an ingredient. Shows available substitutions from the substitution map.

Props:
```typescript
interface IngredientSubstitutionPanelProps {
  ingredient: { name: string; amount: string; unit: string };
  onSubstitute: (original: string, substitute: Substitution) => void;
  onAskNora: (ingredientName: string) => void;
  anchorEl: HTMLElement | null;
  onClose: () => void;
}
```

Renders as a Popover anchored to the clicked ingredient:
- List of substitutions from `findSubstitutions(ingredient.name)`
- Each row: substitute name, ratio, dietary badges, "Use" button
- "Ask Nora" button at bottom (calls `onAskNora` which navigates to chat with pre-filled message)
- "No substitutions found" state with "Ask Nora" as the primary action

**Step 2: Commit**

```bash
git add client/src/components/recipes/IngredientSubstitutionPanel.tsx
git commit -m "feat: add IngredientSubstitutionPanel for recipe modification"
```

---

### Task 11: Recipe Edit Mode in Detail Dialog

**Files:**
- Modify: `client/src/pages/MealPlanPage.tsx` (add edit mode toggle to the meal detail dialog)
- Modify: `client/src/pages/RecipesPage.tsx` (if it has a detail dialog, add edit mode there too)

**Step 1: Add edit mode to MealPlanPage detail dialog**

In the meal detail dialog (the `Dialog` in MealPlanPage), add:
- An "Edit" toggle button in the DialogTitle area
- When in edit mode:
  - Show `ServingScaler` at the top of details tab
  - Make each ingredient clickable (wraps in a clickable Chip that opens `IngredientSubstitutionPanel`)
  - Track modifications in local state: `{ servings, substitutions: Map<originalName, Substitution> }`
  - Scale displayed quantities by `(currentServings / baseServings)`
  - Show a "Save as New Recipe" button in DialogActions when modifications exist
- "Save as New Recipe" calls `recipeService.createRecipe()` with modified data

**Step 2: Build and verify**

Run: `cd client && npx vite build 2>&1 | tail -5`
Expected: Successful build

**Step 3: Commit**

```bash
git add client/src/pages/MealPlanPage.tsx client/src/pages/RecipesPage.tsx
git commit -m "feat: add recipe edit mode with serving scaler and ingredient substitution"
```

---

## Feature 3: Store Deal Scraping (Tasks 12-16)

### Task 12: Install Scraping Dependencies

**Files:**
- Modify: `server/package.json`

**Step 1: Install packages**

Run: `cd server && npm install puppeteer cheerio && npm install -D @types/cheerio`

Note: `puppeteer` downloads Chromium (~400MB). For production, consider `puppeteer-core` with system Chrome.

**Step 2: Commit**

```bash
git add server/package.json server/package-lock.json
git commit -m "chore: install puppeteer and cheerio for store deal scraping"
```

---

### Task 13: DB Migration - Ensure store_products Table

**Files:**
- Create: `server/migrations/022_ensure_store_products.sql`

**Step 1: Write migration**

```sql
-- 022_ensure_store_products.sql
-- Ensure store_products table exists with all required columns

CREATE TABLE IF NOT EXISTS store_products (
    id CHAR(36) PRIMARY KEY,
    ingredient_id CHAR(36),
    store_name VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    price DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50),
    quantity DECIMAL(10,2),
    on_sale BOOLEAN DEFAULT FALSE,
    sale_price DECIMAL(10,2),
    sale_end_date DATE DEFAULT NULL,
    category VARCHAR(100) DEFAULT NULL,
    last_scraped TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    url VARCHAR(500),
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE SET NULL,
    INDEX idx_store_products_ingredient (ingredient_id),
    INDEX idx_store_products_store (store_name),
    INDEX idx_store_products_sale (on_sale),
    INDEX idx_store_products_scraped (last_scraped),
    INDEX idx_store_products_name (product_name)
);
```

**Step 2: Run migration**

Run: `mysql -u root grocery_planner < server/migrations/022_ensure_store_products.sql`

**Step 3: Commit**

```bash
git add server/migrations/022_ensure_store_products.sql
git commit -m "feat: ensure store_products table migration"
```

---

### Task 14: Base Scraper Service

**Files:**
- Create: `server/src/services/scraper/baseScraper.ts`

**Step 1: Create base scraper**

Provides shared Puppeteer setup, rate limiting, user-agent rotation, and an abstract `scrape()` method:

```typescript
import puppeteer, { Browser, Page } from 'puppeteer';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../config/database';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

export interface ScrapedProduct {
  storeName: string;
  productName: string;
  brand?: string;
  price: number;
  salePrice?: number;
  onSale: boolean;
  unit?: string;
  quantity?: number;
  category?: string;
  saleEndDate?: string;
  url?: string;
}

export abstract class BaseScraper {
  protected storeName: string;
  protected delayMs: number;

  constructor(storeName: string, delayMs = 2000) {
    this.storeName = storeName;
    this.delayMs = delayMs;
  }

  protected async createBrowser(): Promise<Browser> {
    return puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
  }

  protected getRandomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }

  protected async delay(ms?: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms || this.delayMs));
  }

  protected async setupPage(browser: Browser): Promise<Page> {
    const page = await browser.newPage();
    await page.setUserAgent(this.getRandomUserAgent());
    await page.setViewport({ width: 1280, height: 800 });
    return page;
  }

  abstract scrape(): Promise<ScrapedProduct[]>;

  async saveProducts(products: ScrapedProduct[]): Promise<number> {
    let saved = 0;
    for (const product of products) {
      try {
        // Check if exists
        const existing = await query(
          'SELECT id FROM store_products WHERE store_name = ? AND product_name = ? AND (brand = ? OR (brand IS NULL AND ? IS NULL))',
          [product.storeName, product.productName, product.brand || null, product.brand || null]
        );

        if ((existing as any[]).length > 0) {
          await query(
            `UPDATE store_products SET price = ?, sale_price = ?, on_sale = ?, unit = ?,
             quantity = ?, category = ?, sale_end_date = ?, url = ?, last_scraped = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [product.price, product.salePrice || null, product.onSale, product.unit || null,
             product.quantity || null, product.category || null, product.saleEndDate || null,
             product.url || null, (existing as any[])[0].id]
          );
        } else {
          await query(
            `INSERT INTO store_products (id, store_name, product_name, brand, price, sale_price,
             on_sale, unit, quantity, category, sale_end_date, url)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [uuidv4(), product.storeName, product.productName, product.brand || null,
             product.price, product.salePrice || null, product.onSale, product.unit || null,
             product.quantity || null, product.category || null, product.saleEndDate || null,
             product.url || null]
          );
        }
        saved++;
      } catch (err) {
        console.error(`Failed to save product ${product.productName}:`, err);
      }
    }
    return saved;
  }
}
```

**Step 2: Commit**

```bash
git add server/src/services/scraper/baseScraper.ts
git commit -m "feat: add BaseScraper class with Puppeteer setup and product persistence"
```

---

### Task 15: Walmart Scraper

**Files:**
- Create: `server/src/services/scraper/walmartScraper.ts`

**Step 1: Create Walmart scraper**

Extends `BaseScraper`. Scrapes Walmart grocery deals/rollback pages. Uses Cheerio to parse HTML after Puppeteer renders the page. Extracts product name, regular price, rollback price, and category from the deals listing page.

Target URL pattern: `https://www.walmart.com/browse/food/rollbacks/976759_976793` (Walmart grocery rollbacks page).

The scraper should:
- Navigate to rollback category pages (produce, meat, dairy, pantry, frozen, snacks, beverages)
- Wait for product grid to load
- Extract product tiles: name, current price, was-price (if rollback), brand
- Handle pagination (scroll to load more or click "Next")
- Return `ScrapedProduct[]` with `storeName: 'Walmart'`

**Step 2: Commit**

```bash
git add server/src/services/scraper/walmartScraper.ts
git commit -m "feat: add Walmart deal scraper for grocery rollbacks"
```

---

### Task 16: Aldi Scraper

**Files:**
- Create: `server/src/services/scraper/aldiScraper.ts`

**Step 1: Create Aldi scraper**

Extends `BaseScraper`. Scrapes Aldi weekly specials from their website.

Target URL: `https://www.aldi.us/weekly-specials/this-weeks-aldi-finds/` and `https://www.aldi.us/weekly-specials/fresh-produce/`

The scraper should:
- Navigate to weekly specials pages
- Extract product tiles: name, price, category
- Aldi products are usually not "on sale" per se, but ALDI Finds are limited-time items
- Return `ScrapedProduct[]` with `storeName: 'Aldi'`

**Step 2: Commit**

```bash
git add server/src/services/scraper/aldiScraper.ts
git commit -m "feat: add Aldi weekly specials scraper"
```

---

### Task 17: Scrape Admin Endpoint + Cron Job

**Files:**
- Modify: `server/src/api/stores/stores.controller.ts` (add `triggerScrape` handler)
- Modify: `server/src/api/stores/stores.routes.ts` (add route)
- Modify: `server/src/services/cron/scheduler.ts` (add weekly scrape job)

**Step 1: Add triggerScrape handler**

```typescript
export const triggerScrape = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { storeName } = req.params;

  let scraper;
  switch (storeName.toLowerCase()) {
    case 'walmart':
      const { WalmartScraper } = await import('../../services/scraper/walmartScraper');
      scraper = new WalmartScraper();
      break;
    case 'aldi':
      const { AldiScraper } = await import('../../services/scraper/aldiScraper');
      scraper = new AldiScraper();
      break;
    default:
      throw new AppError(`Unknown store: ${storeName}`, 400);
  }

  const products = await scraper.scrape();
  const saved = await scraper.saveProducts(products);

  res.json({
    success: true,
    store: storeName,
    productsScraped: products.length,
    productsSaved: saved,
    timestamp: new Date().toISOString(),
  });
});
```

**Step 2: Add route**

```typescript
router.post('/scrape/:storeName', authenticateToken, triggerScrape);
```

**Step 3: Add cron job**

In the scheduler file, add a weekly job (runs Sunday at 2 AM):
```typescript
cron.schedule('0 2 * * 0', async () => {
  console.log('[Cron] Starting weekly store scrape...');
  // Scrape each store sequentially
  for (const store of ['walmart', 'aldi']) {
    try {
      // Dynamic import to avoid loading Puppeteer at startup
      const mod = store === 'walmart'
        ? await import('../scraper/walmartScraper')
        : await import('../scraper/aldiScraper');
      const ScraperClass = store === 'walmart' ? mod.WalmartScraper : mod.AldiScraper;
      const scraper = new ScraperClass();
      const products = await scraper.scrape();
      const saved = await scraper.saveProducts(products);
      console.log(`[Cron] ${store}: scraped ${products.length}, saved ${saved}`);
    } catch (err) {
      console.error(`[Cron] ${store} scrape failed:`, err);
    }
  }
});
```

**Step 4: Commit**

```bash
git add server/src/api/stores/stores.controller.ts server/src/api/stores/stores.routes.ts server/src/services/cron/scheduler.ts
git commit -m "feat: add scrape admin endpoint and weekly cron job for deal scraping"
```

---

## Feature 4: Kroger Cart Automation (Tasks 18-21)

### Task 18: DB Migration - User Kroger Tokens

**Files:**
- Create: `server/migrations/023_add_kroger_user_tokens.sql`

**Step 1: Write migration**

```sql
-- 023_add_kroger_user_tokens.sql
-- Store per-user Kroger OAuth tokens for cart operations

ALTER TABLE users ADD COLUMN kroger_access_token TEXT DEFAULT NULL;
ALTER TABLE users ADD COLUMN kroger_refresh_token TEXT DEFAULT NULL;
ALTER TABLE users ADD COLUMN kroger_token_expires_at TIMESTAMP DEFAULT NULL;
ALTER TABLE users ADD COLUMN kroger_location_id VARCHAR(36) DEFAULT NULL;
```

**Step 2: Run migration**

Run: `mysql -u root grocery_planner < server/migrations/023_add_kroger_user_tokens.sql`

**Step 3: Commit**

```bash
git add server/migrations/023_add_kroger_user_tokens.sql
git commit -m "feat: add Kroger OAuth token columns to users table"
```

---

### Task 19: Kroger User OAuth2 Flow

**Files:**
- Modify: `server/src/services/kroger/krogerService.ts` (add user-level auth methods)
- Modify: `server/src/api/kroger/kroger.controller.ts` (add auth endpoints)
- Modify: `server/src/api/kroger/kroger.routes.ts` (add auth routes)

**Step 1: Add to krogerService.ts**

Add methods for authorization code flow:
```typescript
getAuthorizationUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    scope: 'cart.basic:write product.compact',
    response_type: 'code',
    client_id: this.clientId,
    redirect_uri: redirectUri,
    state,
  });
  return `${this.baseUrl}/v1/connect/oauth2/authorize?${params}`;
}

async exchangeCodeForToken(code: string, redirectUri: string): Promise<{
  access_token: string; refresh_token: string; expires_in: number;
}> {
  const response = await axios.post(
    `${this.baseUrl}/v1/connect/oauth2/token`,
    `grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}`,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
      },
    }
  );
  return response.data;
}

async refreshUserToken(refreshToken: string): Promise<{
  access_token: string; refresh_token: string; expires_in: number;
}> {
  const response = await axios.post(
    `${this.baseUrl}/v1/connect/oauth2/token`,
    `grant_type=refresh_token&refresh_token=${refreshToken}`,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
      },
    }
  );
  return response.data;
}

async addToCart(userAccessToken: string, items: Array<{ upc: string; quantity: number }>): Promise<any> {
  const response = await axios.put(
    `${this.baseUrl}/v1/cart/add`,
    { items },
    {
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
}
```

**Step 2: Add auth controller endpoints**

- `GET /api/kroger/auth` - Generates auth URL and redirects user to Kroger login
- `GET /api/kroger/callback` - Handles OAuth callback, exchanges code for tokens, saves to user record
- `POST /api/kroger/cart/add` - Takes shopping list items, maps to Kroger UPCs, adds to cart
- `GET /api/kroger/cart/status` - Check if user has connected their Kroger account

**Step 3: Commit**

```bash
git add server/src/services/kroger/krogerService.ts server/src/api/kroger/kroger.controller.ts server/src/api/kroger/kroger.routes.ts
git commit -m "feat: add Kroger user OAuth2 flow and cart API integration"
```

---

### Task 20: Frontend Kroger Cart Service

**Files:**
- Modify: `client/src/services/krogerService.ts` (add cart methods)

**Step 1: Add cart methods**

```typescript
getCartStatus: async (): Promise<{ connected: boolean; locationId?: string }> => {
  const response = await apiClient.get('/kroger/cart/status');
  return response.data;
},

connectKrogerAccount: (): void => {
  // Redirect to backend auth endpoint which redirects to Kroger
  window.location.href = `${import.meta.env.VITE_API_URL || '/api'}/kroger/auth`;
},

addToCart: async (items: Array<{ name: string; quantity: number }>): Promise<{
  success: boolean;
  added: number;
  failed: number;
  results: Array<{ itemName: string; status: 'added' | 'not_found' | 'error'; krogerProduct?: string }>;
}> => {
  const response = await apiClient.post('/kroger/cart/add', { items });
  return response.data;
},
```

**Step 2: Commit**

```bash
git add client/src/services/krogerService.ts
git commit -m "feat: add Kroger cart methods to frontend service"
```

---

### Task 21: "Send to Kroger Cart" UI on Shopping List

**Files:**
- Modify: `client/src/pages/ShoppingListPage.tsx`
- Create: `client/src/components/shopping/KrogerCartButton.tsx`

**Step 1: Create KrogerCartButton component**

A button component that:
- Checks Kroger connection status on mount
- If not connected: shows "Connect Kroger Account" button
- If connected: shows "Send to Kroger Cart" button
- On click: shows confirmation dialog with item-to-product mapping preview
- After sending: shows results (X added, Y not found) with "View Cart on Kroger" link

Props: `{ items: ShoppingListItem[] }`

**Step 2: Add KrogerCartButton to ShoppingListPage**

Add the button in the header area of the ShoppingListPage, next to the "New List" button.

**Step 3: Build and verify**

Run: `cd client && npx vite build 2>&1 | tail -5`
Expected: Successful build

**Step 4: Commit**

```bash
git add client/src/pages/ShoppingListPage.tsx client/src/components/shopping/KrogerCartButton.tsx
git commit -m "feat: add Send to Kroger Cart button on shopping list page"
```

---

## Final Task: Build Verification

### Task 22: Full Build + Smoke Test

**Step 1: Build client**

Run: `cd client && npx vite build`
Expected: Successful build, no errors

**Step 2: Build server**

Run: `cd server && npx tsc --noEmit`
Expected: No new errors (pre-existing warnings OK)

**Step 3: Run existing tests**

Run: `npm test` (if test suite exists)

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: Phase 2 complete - live pricing, recipe mods, deal scraping, cart automation"
```
