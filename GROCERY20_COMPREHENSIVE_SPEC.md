# Grocery20 - Comprehensive Product & Technical Specification

## Version 2.0 | AI-Powered Intelligent Meal Planning Platform

**Domain:** https://grocery.dwaynecon.com  
**Author:** Dwayne Concepcion  
**Last Updated:** November 2025

---

## 🎯 Executive Summary

Grocery20 is an AI-powered meal planning platform that creates **personalized weekly menus based on household preferences, learns over time to fine-tune recommendations**, and generates optimized shopping lists **constrained by allocated budgets using real-time local grocery prices** in the user's zipcode.

### Core Value Propositions

1. **Preference-Driven Meal Generation** - Every meal is tailored to the household's collective dietary needs, taste preferences, and restrictions
2. **Adaptive AI Learning** - The system learns from feedback, cooking patterns, and ratings to continuously improve meal recommendations
3. **Budget-Aware Planning** - Menus are generated within the household's allocated weekly/monthly budget using real-time pricing data
4. **Location-Based Pricing** - Real-time grocery prices pulled from Kroger API and web scraping for the user's specific zipcode
5. **Family-First Design** - Supports multiple household members with individual preferences that are balanced into cohesive meal plans

---

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GROCERY20 ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐        │
│  │   React Client  │────▶│   Express API   │────▶│  MySQL (GoDaddy)│        │
│  │   (Vite + TS)   │◀────│   (Node 20 LTS) │◀────│    Production   │        │
│  └─────────────────┘     └────────┬────────┘     └─────────────────┘        │
│                                   │                                          │
│                    ┌──────────────┴──────────────┐                          │
│                    ▼                              ▼                          │
│          ┌─────────────────┐           ┌─────────────────┐                  │
│          │   OpenAI GPT-4  │           │  Pricing Engine │                  │
│          │  (Meal Planning)│           │  ┌───────────┐  │                  │
│          └─────────────────┘           │  │Kroger API │  │                  │
│                                        │  ├───────────┤  │                  │
│          ┌─────────────────┐           │  │Web Scraper│  │                  │
│          │  AI Learning    │           │  └───────────┘  │                  │
│          │  Engine (ML)    │           └─────────────────┘                  │
│          └─────────────────┘                                                 │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🧠 AI Learning System - Household Preference Engine

### Overview

The AI doesn't just generate random meals—it **learns from each household** to deliver increasingly personalized recommendations over time. This is the core differentiator of Grocery20.

### Learning Vectors

| Learning Source | Data Points | AI Application |
|-----------------|-------------|----------------|
| **Explicit Ratings** | 1-5 star meal ratings | Direct preference weighting |
| **Implicit Signals** | Meals skipped, recipes viewed, time spent | Interest/disinterest indicators |
| **Cooking Patterns** | Prep time preferences, complexity tolerance | Recipe difficulty matching |
| **Seasonal Trends** | Weather, holidays, time of year | Contextual meal suggestions |
| **Budget Behavior** | Splurge vs. save patterns | Cost optimization |
| **Feedback Loops** | "Too spicy", "Not enough protein" | Attribute adjustment |

### Preference Learning Algorithm

```
HOUSEHOLD_PREFERENCE_SCORE = 
    (Σ explicit_ratings × weight_explicit) +
    (Σ implicit_signals × weight_implicit) +
    (Σ member_preferences × member_weight) +
    (temporal_decay_factor × historical_data) +
    (budget_alignment_score)

Where:
- weight_explicit = 0.4 (highest trust)
- weight_implicit = 0.25
- member_weight = varies by age/dietary restrictions
- temporal_decay_factor = 0.95^weeks_since_rating
```

### Preference Categories Tracked


#### 1. Dietary Preferences
```json
{
  "dietary_preferences": {
    "cuisines": {
      "loved": ["Mexican", "Italian", "Asian"],
      "disliked": ["French", "Indian"],
      "neutral": ["American", "Mediterranean"]
    },
    "proteins": {
      "preferred": ["chicken", "fish", "tofu"],
      "avoided": ["lamb", "organ meats"],
      "frequency_limits": {"red_meat": "2x_per_week"}
    },
    "vegetables": {
      "favorites": ["broccoli", "spinach", "bell peppers"],
      "disliked": ["brussels sprouts", "beets"]
    },
    "flavor_profiles": {
      "spice_tolerance": 6,  // 1-10 scale
      "sweetness_preference": 4,
      "umami_appreciation": 8
    }
  }
}
```

#### 2. Lifestyle Patterns
```json
{
  "lifestyle_patterns": {
    "cooking_time": {
      "weekday_max_minutes": 30,
      "weekend_max_minutes": 90,
      "batch_cooking_days": ["Sunday"]
    },
    "meal_complexity": {
      "weekday_preference": "simple",
      "weekend_preference": "elaborate"
    },
    "schedule": {
      "busy_days": ["Tuesday", "Thursday"],
      "family_dinner_days": ["Sunday"]
    }
  }
}
```

#### 3. Health Goals
```json
{
  "health_goals": {
    "primary_goal": "weight_management",
    "calorie_target": 2000,
    "macro_targets": {
      "protein_percent": 30,
      "carbs_percent": 40,
      "fat_percent": 30
    },
    "restrictions": {
      "sodium_limit_mg": 2300,
      "sugar_limit_g": 50
    }
  }
}
```

### AI Fine-Tuning Process

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AI LEARNING FEEDBACK LOOP                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [Generate Meal Plan] ───▶ [User Interacts] ───▶ [Collect Feedback] │
│          ▲                                              │            │
│          │                                              ▼            │
│          │                                    [Process Signals]      │
│          │                                              │            │
│          │                                              ▼            │
│          │                                    [Update Preference     │
│          │                                     Model Weights]        │
│          │                                              │            │
│          └──────────────────────────────────────────────┘            │
│                                                                      │
│  FEEDBACK TYPES:                                                     │
│  ✓ Explicit: Ratings, comments, "Don't show again"                   │
│  ✓ Implicit: Recipe views, cooking confirmations, skips             │
│  ✓ Behavioral: Time on recipe page, ingredient substitutions        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 💰 Budget-Aware Menu Generation

### Zipcode-Based Pricing System

The system creates menus **constrained by the household's allocated budget** using real-time prices from the user's local grocery stores.

### Budget Allocation Model

```json
{
  "household_budget": {
    "zipcode": "62656",
    "weekly_budget": 150.00,
    "allocation_strategy": "balanced",
    "priorities": {
      "protein": 0.35,
      "produce": 0.25,
      "dairy": 0.15,
      "pantry": 0.15,
      "other": 0.10
    },
    "flexibility": {
      "can_exceed_by_percent": 10,
      "carry_over_savings": true
    }
  }
}
```

### Menu Generation with Budget Constraints

```
ALGORITHM: Budget-Constrained Meal Planning

INPUT:
  - household_preferences (from AI learning engine)
  - weekly_budget ($)
  - zipcode (for local pricing)
  - num_meals (breakfast/lunch/dinner for 7 days)

PROCESS:
  1. Fetch real-time prices for zipcode
  2. Generate candidate meal list based on preferences
  3. For each candidate meal:
     a. Calculate ingredient costs (real-time prices)
     b. Score meal by preference_score / cost ratio
  4. Use optimization algorithm to select meals:
     - Maximize: Σ(preference_scores)
     - Constraint: Σ(meal_costs) ≤ weekly_budget
     - Balance: Variety, nutrition, prep time distribution
  5. Generate shopping list with store-specific prices
  
OUTPUT:
  - Optimized meal plan within budget
  - Itemized shopping list with costs
  - Budget breakdown by category
```

---

## 🛒 Real-Time Pricing Engine

### Primary Source: Kroger API Integration


```typescript
// server/src/services/pricing/kroger.service.ts

interface KrogerConfig {
  clientId: string;
  clientSecret: string;
  baseUrl: string;
  scope: string[];
}

interface ProductPrice {
  productId: string;
  upc: string;
  name: string;
  brand: string;
  price: number;
  pricePerUnit: number;
  unit: string;
  inStock: boolean;
  aisle: string;
  storeId: string;
  lastUpdated: Date;
}

class KrogerPricingService {
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  async authenticate(): Promise<void> {
    const response = await fetch('https://api.kroger.com/v1/connect/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(
          `${process.env.KROGER_CLIENT_ID}:${process.env.KROGER_CLIENT_SECRET}`
        ).toString('base64')}`
      },
      body: 'grant_type=client_credentials&scope=product.compact'
    });
    
    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = new Date(Date.now() + data.expires_in * 1000);
  }

  async findStoresByZipcode(zipcode: string, radius: number = 10): Promise<Store[]> {
    await this.ensureAuthenticated();
    
    const response = await fetch(
      `https://api.kroger.com/v1/locations?filter.zipCode.near=${zipcode}&filter.radiusInMiles=${radius}`,
      { headers: { 'Authorization': `Bearer ${this.accessToken}` }}
    );
    
    return response.json();
  }

  async getProductPrices(
    storeId: string, 
    productTerms: string[]
  ): Promise<ProductPrice[]> {
    await this.ensureAuthenticated();
    
    const prices: ProductPrice[] = [];
    
    for (const term of productTerms) {
      const response = await fetch(
        `https://api.kroger.com/v1/products?filter.term=${encodeURIComponent(term)}&filter.locationId=${storeId}`,
        { headers: { 'Authorization': `Bearer ${this.accessToken}` }}
      );
      
      const data = await response.json();
      prices.push(...this.mapToProductPrices(data, storeId));
    }
    
    return prices;
  }

  async getPricesForShoppingList(
    zipcode: string,
    ingredients: string[]
  ): Promise<PricedShoppingList> {
    // Find nearest store
    const stores = await this.findStoresByZipcode(zipcode);
    const nearestStore = stores[0];
    
    // Get prices for all ingredients
    const prices = await this.getProductPrices(nearestStore.locationId, ingredients);
    
    return {
      storeId: nearestStore.locationId,
      storeName: nearestStore.name,
      storeAddress: nearestStore.address,
      items: prices,
      totalEstimate: prices.reduce((sum, p) => sum + p.price, 0),
      lastUpdated: new Date()
    };
  }
}
```

### Fallback: Web Scraping Service

When Kroger API is unavailable or for stores not covered by Kroger, we use intelligent web scraping:

```typescript
// server/src/services/pricing/scraper.service.ts

import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

interface ScraperConfig {
  stores: {
    name: string;
    baseUrl: string;
    selectors: {
      productName: string;
      price: string;
      unitPrice: string;
      availability: string;
    };
  }[];
}

class GroceryScraperService {
  private config: ScraperConfig;
  private cache: Map<string, CachedPrice> = new Map();
  private cacheTTL = 4 * 60 * 60 * 1000; // 4 hours

  async scrapeWalmartPrices(
    zipcode: string, 
    products: string[]
  ): Promise<ProductPrice[]> {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Set location by zipcode
    await page.goto(`https://www.walmart.com/store/finder?location=${zipcode}`);
    
    const prices: ProductPrice[] = [];
    
    for (const product of products) {
      const searchUrl = `https://www.walmart.com/search?q=${encodeURIComponent(product)}`;
      await page.goto(searchUrl);
      
      // Wait for products to load
      await page.waitForSelector('[data-testid="list-view"]');
      
      const html = await page.content();
      const $ = cheerio.load(html);
      
      // Extract first product result
      const firstResult = $('[data-testid="list-view"] > div').first();
      prices.push({
        name: firstResult.find('[data-automation-id="product-title"]').text(),
        price: parseFloat(firstResult.find('[data-automation-id="product-price"]').text().replace('$', '')),
        store: 'Walmart',
        zipcode
      });
    }
    
    await browser.close();
    return prices;
  }

  async scrapeTargetPrices(zipcode: string, products: string[]): Promise<ProductPrice[]> {
    // Similar implementation for Target
  }

  async scrapeSafewayPrices(zipcode: string, products: string[]): Promise<ProductPrice[]> {
    // Similar implementation for Safeway
  }

  // Aggregate prices from multiple sources
  async getBestPrices(
    zipcode: string, 
    products: string[]
  ): Promise<PriceComparison[]> {
    const [kroger, walmart, target] = await Promise.allSettled([
      this.krogerService.getPricesForShoppingList(zipcode, products),
      this.scrapeWalmartPrices(zipcode, products),
      this.scrapeTargetPrices(zipcode, products)
    ]);

    return this.aggregateAndCompare(kroger, walmart, target);
  }
}
```

### Pricing Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PRICING DATA PIPELINE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [User Zipcode] ───▶ [Store Locator] ───▶ [Nearest Stores by Distance]      │
│                              │                                               │
│                              ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────┐        │
│  │                    PRICING SOURCES                               │        │
│  ├──────────────────┬──────────────────┬───────────────────────────┤        │
│  │   Kroger API     │  Web Scraping    │   Cached Prices (Redis)   │        │
│  │   (Primary)      │  (Fallback)      │   (TTL: 4 hours)          │        │
│  └────────┬─────────┴────────┬─────────┴─────────────┬─────────────┘        │
│           │                  │                        │                      │
│           └──────────────────┴────────────────────────┘                      │
│                              │                                               │
│                              ▼                                               │
│                    [Price Aggregation Engine]                                │
│                              │                                               │
│                              ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────┐        │
│  │  OUTPUT: Optimized Shopping List                                 │        │
│  │  - Best prices per item                                          │        │
│  │  - Store recommendations                                         │        │
│  │  - Total cost calculation                                        │        │
│  │  - Budget alignment status                                       │        │
│  └─────────────────────────────────────────────────────────────────┘        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ MySQL Database Schema (GoDaddy Production)


### Database Configuration for GoDaddy

```typescript
// server/src/config/database.ts

import mysql from 'mysql2/promise';

const productionConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'grocery_planner',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // GoDaddy specific settings
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: true
  } : undefined
};

export const pool = mysql.createPool(productionConfig);
```

### Enhanced Schema for AI Learning & Pricing

```sql
-- AI Grocery Planner Database Schema v2.0
-- MySQL 8.0+ for GoDaddy Production
-- Enhanced with AI Learning and Real-Time Pricing

-- ============================================
-- CORE USER & HOUSEHOLD TABLES
-- ============================================

CREATE TABLE users (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    household_id CHAR(36),
    zipcode VARCHAR(10),
    timezone VARCHAR(50) DEFAULT 'America/Chicago',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_household_id (household_id),
    INDEX idx_zipcode (zipcode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE households (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    zipcode VARCHAR(10) NOT NULL,
    budget_weekly DECIMAL(10,2) DEFAULT 150.00,
    budget_monthly DECIMAL(10,2) DEFAULT 600.00,
    budget_flexibility_percent INT DEFAULT 10,
    preferred_stores JSON COMMENT 'Array of store preferences',
    meal_schedule JSON COMMENT 'Weekly meal planning schedule',
    created_by CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_zipcode (zipcode),
    INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE household_members (
    id CHAR(36) PRIMARY KEY,
    household_id CHAR(36) NOT NULL,
    user_id CHAR(36) COMMENT 'NULL if not a registered user',
    name VARCHAR(255) NOT NULL,
    relationship ENUM('self', 'spouse', 'child', 'parent', 'other') DEFAULT 'other',
    age INT,
    dietary_restrictions JSON COMMENT 'Array of restrictions',
    food_allergies JSON COMMENT 'Array of allergies with severity',
    preferences JSON COMMENT 'Individual food preferences',
    calorie_target INT,
    is_primary_cook BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_household_id (household_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- AI LEARNING & PREFERENCES TABLES
-- ============================================

CREATE TABLE household_preferences (
    id CHAR(36) PRIMARY KEY,
    household_id CHAR(36) NOT NULL,
    preference_type ENUM(
        'cuisine', 'ingredient', 'cooking_method', 
        'meal_type', 'flavor_profile', 'complexity'
    ) NOT NULL,
    preference_value VARCHAR(255) NOT NULL,
    score DECIMAL(5,2) DEFAULT 0.00 COMMENT '-10 to +10 preference scale',
    confidence DECIMAL(3,2) DEFAULT 0.50 COMMENT '0 to 1 confidence level',
    data_points INT DEFAULT 0 COMMENT 'Number of feedback instances',
    last_interaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_household_pref (household_id, preference_type, preference_value),
    INDEX idx_household_id (household_id),
    INDEX idx_preference_type (preference_type),
    INDEX idx_score (score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE preference_feedback (
    id CHAR(36) PRIMARY KEY,
    household_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    recipe_id CHAR(36),
    meal_plan_id CHAR(36),
    feedback_type ENUM(
        'rating', 'skip', 'cooked', 'saved', 
        'modified', 'comment', 'never_again'
    ) NOT NULL,
    rating INT COMMENT '1-5 star rating',
    comment TEXT,
    attributes_liked JSON COMMENT 'What they liked about the meal',
    attributes_disliked JSON COMMENT 'What they disliked',
    would_make_again BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE SET NULL,
    FOREIGN KEY (meal_plan_id) REFERENCES meal_plans(id) ON DELETE SET NULL,
    INDEX idx_household_id (household_id),
    INDEX idx_recipe_id (recipe_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ai_learning_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    household_id CHAR(36) NOT NULL,
    event_type ENUM(
        'meal_generated', 'meal_viewed', 'meal_cooked',
        'meal_skipped', 'meal_rated', 'preference_updated',
        'budget_adjusted', 'store_changed'
    ) NOT NULL,
    event_data JSON NOT NULL,
    model_version VARCHAR(50),
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
    INDEX idx_household_id (household_id),
    INDEX idx_event_type (event_type),
    INDEX idx_processed (processed),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- REAL-TIME PRICING TABLES
-- ============================================

CREATE TABLE stores (
    id CHAR(36) PRIMARY KEY,
    external_id VARCHAR(100) COMMENT 'Kroger location ID or other API ID',
    name VARCHAR(255) NOT NULL,
    chain ENUM('kroger', 'walmart', 'target', 'safeway', 'aldi', 'costco', 'other') NOT NULL,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2),
    zipcode VARCHAR(10) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone VARCHAR(20),
    hours JSON,
    features JSON COMMENT 'Pickup, delivery, pharmacy, etc.',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_zipcode (zipcode),
    INDEX idx_chain (chain),
    INDEX idx_external_id (external_id),
    SPATIAL INDEX idx_location (POINT(latitude, longitude))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

