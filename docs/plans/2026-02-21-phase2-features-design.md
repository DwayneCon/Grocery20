# Phase 2 Features Design

**Date:** 2026-02-21
**Status:** Approved
**Scope:** Live Kroger Pricing, Store Deal Scraping, Recipe Modification UI, Cart Automation

---

## 1. Live Kroger Pricing

### Current State
- Kroger API service fully functional (OAuth2, product search, bulk pricing, 5-hour cache)
- Shopping List has "Price Comparison" tab querying empty `store_products` table
- `store_products` table schema ready

### Design
**New endpoint:** `POST /api/stores/compare-live`
- Takes shopping list items array
- Calls `krogerService.getBulkPrices(items, locationId)` for live Kroger prices
- Queries `store_products` table for Walmart/Aldi scraped data
- Returns unified comparison: per-item prices + per-store totals + savings

**Store selector:** User sets zip code once (saved to `households` table). App finds nearby Kroger locations via existing `/api/kroger/stores?zipCode=...`.

**Frontend changes:**
- `PriceComparison` component calls new `/api/stores/compare-live` instead of empty table query
- Each shopping list item shows best available price inline
- Price Comparison tab shows store-by-store breakdown with total savings

---

## 2. Store Deal Scraping (Walmart + Aldi)

### Current State
- `store_products` table exists with columns for price, sale_price, on_sale, last_scraped
- No scraping code exists

### Design
**Scraper service:** `server/src/services/scraper/`
- `baseScraper.ts` - Shared Puppeteer setup, rate limiting, user agent rotation
- `walmartScraper.ts` - Scrapes Walmart grocery deals/rollbacks
- `aldiScraper.ts` - Scrapes Aldi weekly specials and ALDI Finds

**Each scraper extracts:**
- product_name, brand, price, sale_price, on_sale, category, valid_dates, url

**Data pipeline:**
- Results upsert into `store_products` table (keyed on store_name + product_name)
- Admin endpoint: `POST /api/stores/scrape/:storeName` triggers a scrape
- Can be cron-triggered externally (daily or weekly)
- Rate-limited: 2-3s delays, respects robots.txt

**Deal freshness:** UI shows "Prices as of [last_scraped date]". Stale data (>7 days) gets a warning badge.

**Fallback:** If scraping fails, app works fine with Kroger live API data. Scraped data is supplemental.

---

## 3. Recipe Modification UI

### Current State
- Recipe CRUD API exists (create, update, delete)
- Recipe display is read-only in UI
- AI can suggest substitutions in chat

### Design
**Serving scaler:**
- Slider or +/- buttons on recipe detail view
- Pure frontend math: `(targetServings / baseServings) * ingredientQuantity`
- Updates displayed quantities in real-time, does not save until user chooses to

**Ingredient substitution:**
- Click any ingredient to see a substitution panel
- Built-in substitution map (~50 common swaps: butter->coconut oil, milk->oat milk, etc.)
- "Ask Nora" button sends ingredient + dietary context to AI for smart alternatives
- Substituted ingredients visually marked (strikethrough original + new ingredient)

**Save as variation:**
- "Save Modified Recipe" button creates new recipe via existing `createRecipe` endpoint
- New recipe name: "[Original Name] (Modified)" - user can edit
- Stores `source_recipe_id` to link variations to originals

**UI location:** Recipe detail dialog gets an "Edit Mode" toggle. When active, ingredients become interactive (clickable for substitution), serving scaler appears, and save button shows.

---

## 4. Kroger Cart Automation

### Current State
- Kroger OAuth2 client credentials flow working
- Product search functional
- No cart API integration

### Design
**Kroger user-level OAuth2:**
- Add authorization code flow for user-level access (current is client credentials only)
- New endpoint: `GET /api/kroger/auth` - redirects to Kroger login
- Callback endpoint: `GET /api/kroger/callback` - exchanges code for user token
- Store user's Kroger access/refresh tokens in `users` table (encrypted)

**Cart API integration:**
- Add `addToCart(items, userToken)` to `krogerService.ts`
- Uses Kroger `PUT /cart/add` endpoint
- Maps shopping list items to Kroger product IDs via existing search

**UI flow:**
1. Shopping List page: "Send to Kroger Cart" button
2. First use: redirect to Kroger login (OAuth2 auth code flow)
3. After auth: show item-to-product mapping preview (user can adjust matches)
4. Confirm: adds all items to Kroger cart
5. Success screen: "X items added" + "View Cart on Kroger.com" link
6. Per-item status: success/failed/not-found

**Note:** Requires Kroger API access level supporting cart operations. If current key lacks cart permissions, need to request upgrade from Kroger developer portal.

---

## Implementation Order

1. **Live Kroger Pricing** - Fastest win, connects existing pieces
2. **Recipe Modification UI** - Self-contained, no external dependencies
3. **Store Deal Scraping** - Needs Puppeteer dependency, longer development
4. **Cart Automation** - Depends on Kroger API permissions verification

## Target Stores
- Kroger (live API - already integrated)
- Walmart (web scraping)
- Aldi (web scraping)
