# CLAUDE.MD - AI Grocery Planner Project Guide

## 🎯 PROJECT OVERVIEW

You are building a production-ready AI-powered grocery planning web application for Dwayne, an Information Services Specialist with extensive development experience. This application will revolutionize meal planning through natural conversation with AI, creating personalized meal plans that consider household preferences, budgets, and local grocery deals.

- **Project Name**: AI Grocery Planner
- **Domain**: grocery.dwaynecon.com (GoDaddy hosted)
- **Developer**: Dwayne (BS in Computer Information Systems, experienced with React, Node.js, Firebase)
- **Status**: Production-ready deployment required

## 🏗️ ARCHITECTURE REQUIREMENTS

### Technology Stack

```yaml
Frontend:
  - Framework: React 18+ with TypeScript
  - State Management: Redux Toolkit + RTK Query
  - UI Library: Material-UI v5 or Chakra UI
  - Styling: Emotion/Styled-Components + Tailwind CSS
  - PWA: Workbox for offline capability
  - Build Tool: Vite (faster than CRA)

Backend:
  - Runtime: Node.js 20 LTS
  - Framework: Express.js with TypeScript
  - API Design: RESTful + GraphQL (Apollo Server)
  - Authentication: Passport.js + JWT
  - Validation: Joi or Zod
  - ORM: Prisma or Sequelize

Database:
  - Primary: MySQL 8.0 (GoDaddy provided)
  - Caching: Redis (if available) or in-memory
  - Session Store: MySQL or Redis
  - File Storage: GoDaddy storage or AWS S3

AI/ML:
  - Primary: OpenAI GPT-4 API
  - Fallback: GPT-3.5-turbo for cost optimization
  - Alternative: Groq or Together AI for free tier
  - Embeddings: OpenAI text-embedding-3-small
  - Vision: GPT-4 Vision for receipt scanning

Infrastructure:
  - Host: GoDaddy Shared/VPS Hosting
  - CDN: Cloudflare (free tier)
  - Domain: grocery.dwaynecon.com
  - SSL: Let's Encrypt (auto-renewal)
  - Monitoring: Sentry + Custom logging
```

## 📁 PROJECT STRUCTURE

```
grocery-planner/
├── client/                      # React frontend
│   ├── public/
│   │   ├── manifest.json       # PWA manifest
│   │   └── service-worker.js   # Offline capability
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   │   ├── chat/          # AI chat interface
│   │   │   ├── meal-plan/     # Meal planning UI
│   │   │   ├── shopping/      # Shopping list components
│   │   │   └── common/        # Shared components
│   │   ├── features/          # Redux slices
│   │   ├── hooks/             # Custom React hooks
│   │   ├── layouts/           # Page layouts
│   │   ├── pages/             # Route pages
│   │   ├── services/          # API services
│   │   ├── styles/            # Global styles
│   │   ├── types/             # TypeScript types
│   │   ├── utils/             # Helper functions
│   │   └── App.tsx
│   ├── .env.production
│   └── vite.config.ts
│
├── server/                     # Node.js backend
│   ├── src/
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── meals/         # Meal planning endpoints
│   │   │   ├── shopping/      # Shopping list endpoints
│   │   │   ├── stores/        # Store integration
│   │   │   └── ai/            # AI chat endpoints
│   │   ├── config/            # Configuration files
│   │   ├── middleware/        # Express middleware
│   │   ├── models/            # Database models
│   │   ├── services/          # Business logic
│   │   │   ├── ai/            # AI service layer
│   │   │   ├── scraper/       # Web scraping service
│   │   │   ├── nutrition/     # Nutrition API service
│   │   │   └── store/         # Store API integrations
│   │   ├── utils/             # Utility functions
│   │   ├── validators/        # Input validation
│   │   └── index.ts           # Entry point
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   └── .env.production
│
├── shared/                     # Shared types/utilities
│   ├── types/                 # Shared TypeScript types
│   └── constants/             # Shared constants
│
├── scripts/                    # Deployment/utility scripts
│   ├── deploy.sh              # GoDaddy deployment
│   ├── backup-db.sh           # Database backup
│   └── seed-db.ts             # Database seeding
│
├── docs/                       # Documentation
│   ├── API.md                 # API documentation
│   ├── DEPLOYMENT.md          # Deployment guide
│   └── SECURITY.md            # Security protocols
│
└── tests/                      # Test files
    ├── unit/                  # Unit tests
    ├── integration/           # Integration tests
    └── e2e/                   # End-to-end tests
```

## 🚀 CORE FEATURES IMPLEMENTATION

### 1. AI Conversation Engine

```typescript
// IMPLEMENTATION REQUIREMENTS:
interface AIConversationEngine {
  // Natural language understanding for meal preferences
  - Parse dietary restrictions from conversation
  - Extract budget constraints
  - Understand time preferences
  - Identify household member preferences
  - Learn from conversation history

  // Context management
  - Maintain conversation state across sessions
  - Track user preferences over time
  - Build household preference profiles
  - Suggest based on past interactions

  // Response generation
  - Stream responses for better UX
  - Provide meal suggestions with reasoning
  - Explain nutritional benefits
  - Offer alternatives when needed
  - Handle clarification requests
}

// KEY FEATURES TO IMPLEMENT:
1. Multi-turn conversation support
2. Preference learning algorithm
3. Context-aware responses
4. Fallback handling for API failures
5. Token optimization for cost control
6. Response caching for common queries
7. Multilingual support (stretch goal)
```

### 2. Household Management System

```typescript
// IMPLEMENTATION REQUIREMENTS:
interface HouseholdSystem {
  // Member management
  - Add/remove household members
  - Individual dietary profiles
  - Age-appropriate meal suggestions
  - Preference voting system
  - Guest member support

  // Preference engine
  - Allergen tracking with severity
  - Cuisine preference scoring
  - Ingredient blacklists
  - Cooking skill levels
  - Time availability patterns

  // Conflict resolution
  - Find common ground between preferences
  - Suggest compromises
  - Alternative meal options
  - Side dish customization
}

// DATABASE SCHEMA:
CREATE TABLE household_members (
  id UUID PRIMARY KEY,
  household_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  age INT,
  dietary_restrictions JSON,
  preferences JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (household_id) REFERENCES households(id)
);
```

### 3. Intelligent Meal Planning

```typescript
// IMPLEMENTATION REQUIREMENTS:
interface MealPlanningEngine {
  // Planning algorithms
  - Multi-day meal optimization
  - Ingredient overlap detection
  - Leftover utilization planning
  - Batch cooking suggestions
  - Seasonal menu adaptation

  // Nutritional balance
  - Macro/micronutrient tracking
  - Caloric distribution
  - Dietary guideline compliance
  - Health goal integration

  // Budget optimization
  - Cost per serving calculation
  - Budget distribution across meals
  - Deal/coupon integration
  - Bulk buying recommendations
}

// ALGORITHM PRIORITIES:
1. Safety (allergies/restrictions) - MANDATORY
2. Budget constraints - HIGH
3. Nutritional goals - MEDIUM
4. Preference satisfaction - MEDIUM
5. Variety/novelty - LOW
```

### 4. Recipe Management

```typescript
// IMPLEMENTATION REQUIREMENTS:
interface RecipeSystem {
  // Recipe features
  - Dynamic scaling for servings
  - Step-by-step instructions
  - Prep/cook time estimates
  - Difficulty ratings
  - Equipment requirements

  // Smart features
  - Ingredient substitution engine
  - Video tutorial embedding
  - User modifications tracking
  - Rating and review system
  - Recipe sharing capability

  // Data structure
  interface Recipe {
    id: string;
    name: string;
    ingredients: Ingredient[];
    instructions: Step[];
    nutrition: NutritionInfo;
    prepTime: number;
    cookTime: number;
    servings: number;
    cost: number;
    difficulty: 'easy' | 'medium' | 'hard';
    tags: string[];
    images: string[];
    video?: string;
    source?: string;
    userRatings: Rating[];
  }
}
```

### 5. Shopping List Generator

```typescript
// IMPLEMENTATION REQUIREMENTS:
interface ShoppingListEngine {
  // List generation
  - Consolidate ingredients across recipes
  - Calculate optimal quantities
  - Group by store sections
  - Include brand preferences
  - Add recurring items

  // Smart features
  - Inventory tracking
  - Expiration date management
  - Price tracking
  - Alternative product suggestions
  - Coupon matching

  // Export options
  - PDF generation
  - Email delivery
  - SMS text
  - Print-friendly format
  - Store app integration
}

// SHOPPING LIST OPTIMIZATION:
1. Combine similar ingredients
2. Round up to package sizes
3. Consider shelf life
4. Apply bulk discounts
5. Match with available coupons
```

### 6. Store Integration & Web Scraping

```typescript
// IMPLEMENTATION REQUIREMENTS:
interface StoreIntegration {
  // Web scraping (Puppeteer/Playwright)
  - Scrape weekly deals
  - Extract product prices
  - Monitor stock levels
  - Capture store hours
  - Find coupon codes

  // API integrations
  - Kroger API connection
  - Walmart API integration
  - Instacart partnership
  - Local store APIs

  // Cart automation
  - Add items to online cart
  - Apply coupons automatically
  - Schedule delivery/pickup
  - Price comparison
  - Availability checking
}

// SCRAPING STRATEGY:
1. Respect robots.txt
2. Implement rate limiting
3. Use rotating user agents
4. Handle captchas gracefully
5. Cache scraped data
6. Fallback to manual entry
```

## 🎨 UI/UX REQUIREMENTS

### Design Principles

```yaml
Innovation Priorities:
  1. Conversational Interface:
     - Voice input/output capability
     - Natural language processing
     - Contextual suggestions
     - Typing indicators
     - Message reactions

  2. Visual Excellence:
     - Glass morphism effects
     - Smooth animations (Framer Motion)
     - Micro-interactions
     - Dark/light mode
     - Custom themes

  3. Mobile-First Design:
     - Touch gestures
     - Swipe actions
     - Bottom navigation
     - Thumb-friendly zones
     - Offline capability

  4. Accessibility Features:
     - WCAG 2.1 AA compliance
     - Screen reader support
     - Keyboard navigation
     - High contrast mode
     - Font size adjustment
     - Reduced motion option
```

### Key UI Components

```typescript
// COMPONENT LIBRARY:
1. ChatInterface:
   - Streaming message display
   - Voice input button
   - Quick action chips
   - File upload (receipts)
   - Emoji reactions

2. MealPlanCalendar:
   - Drag-and-drop meals
   - Week/month views
   - Meal type indicators
   - Quick edit popups
   - Nutritional summary

3. RecipeCard:
   - Image carousel
   - Expandable ingredients
   - Step-by-step mode
   - Timer integration
   - Share functionality

4. ShoppingListView:
   - Checkbox items
   - Swipe to delete
   - Category grouping
   - Price display
   - Store selector

5. BudgetTracker:
   - Progress bars
   - Spending charts
   - Deal alerts
   - Savings summary
   - Historical data
```

## 🔒 SECURITY IMPLEMENTATION

### Security Checklist

```typescript
// MANDATORY SECURITY MEASURES:

1. Authentication & Authorization:
   ✓ JWT with refresh tokens
   ✓ Bcrypt (salt rounds: 12)
   ✓ Session management
   ✓ Rate limiting (express-rate-limit)
   ✓ Account lockout after failures
   ✓ Two-factor authentication
   ✓ OAuth2 integration

2. Input Validation:
   ✓ Sanitize all inputs (DOMPurify)
   ✓ SQL injection prevention (Parameterized queries)
   ✓ XSS protection (helmet.js)
   ✓ CSRF tokens
   ✓ File upload validation
   ✓ Request size limits

3. Data Protection:
   ✓ HTTPS enforcement
   ✓ Encryption at rest
   ✓ Secure cookies (httpOnly, secure, sameSite)
   ✓ API key rotation
   ✓ Environment variable protection
   ✓ PII data masking

4. API Security:
   ✓ CORS configuration
   ✓ API rate limiting
   ✓ Request signing
   ✓ Webhook validation
   ✓ IP whitelisting (optional)

5. Monitoring:
   ✓ Error logging (Sentry)
   ✓ Audit trails
   ✓ Intrusion detection
   ✓ Performance monitoring
   ✓ Uptime monitoring
```

### Environment Variables

```bash
# .env.production (NEVER COMMIT)
NODE_ENV=production
PORT=3001

# Database
DB_HOST=localhost
DB_NAME=grocery_planner
DB_USER=[secure_user]
DB_PASSWORD=[strong_password]
DB_CONNECTION_LIMIT=10

# Authentication
JWT_SECRET=[64-char-random-string]
JWT_REFRESH_SECRET=[different-64-char-string]
SESSION_SECRET=[another-random-string]

# OpenAI
OPENAI_API_KEY=[your-api-key]
OPENAI_ORG_ID=[your-org-id]
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_FALLBACK_MODEL=gpt-3.5-turbo

# Store APIs
KROGER_CLIENT_ID=[client-id]
KROGER_CLIENT_SECRET=[client-secret]
WALMART_API_KEY=[api-key]

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=[email]
SMTP_PASS=[app-password]

# Redis (if available)
REDIS_URL=redis://localhost:6379

# Monitoring
SENTRY_DSN=[your-dsn]

# Security
ENCRYPTION_KEY=[32-byte-key]
RATE_LIMIT_WINDOW=15min
RATE_LIMIT_MAX=100
```

## 🚀 DEPLOYMENT INSTRUCTIONS

### GoDaddy Deployment Steps

```bash
# 1. INITIAL SETUP
ssh [username]@[server-ip]
cd ~/public_html
git clone [repository-url] grocery
cd grocery

# 2. DATABASE SETUP
mysql -u [username] -p
CREATE DATABASE grocery_planner;
USE grocery_planner;
SOURCE ./scripts/schema.sql;
SOURCE ./scripts/seed.sql;
EXIT;

# 3. BACKEND SETUP
cd server
npm install --production
npm run build
cp .env.example .env.production
nano .env.production  # Configure environment variables

# 4. FRONTEND BUILD
cd ../client
npm install
npm run build
cp -r dist/* ~/public_html/grocery.dwaynecon.com/

# 5. PROCESS MANAGEMENT
npm install -g pm2
pm2 start server/dist/index.js --name grocery-api
pm2 startup
pm2 save

# 6. NGINX CONFIGURATION (if available)
server {
    listen 80;
    server_name grocery.dwaynecon.com;

    location / {
        root /home/[username]/public_html/grocery.dwaynecon.com;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# 7. SSL SETUP
certbot --nginx -d grocery.dwaynecon.com

# 8. CRON JOBS
crontab -e
# Add:
0 2 * * * /home/[username]/grocery/scripts/backup-db.sh
0 */6 * * * /home/[username]/grocery/scripts/scrape-deals.sh
```

## ✅ TESTING REQUIREMENTS

### Test Coverage Goals

```yaml
Unit Tests: 80% coverage minimum
Integration Tests: All API endpoints
E2E Tests: Critical user paths
Performance Tests: Load testing for 1000 concurrent users
Security Tests: OWASP Top 10 coverage
Accessibility Tests: WCAG 2.1 AA compliance
```

### Testing Implementation

```typescript
// UNIT TEST EXAMPLE
describe('MealPlanningEngine', () => {
  test('should respect all dietary restrictions', async () => {
    const household = createMockHousehold({
      members: [
        { name: 'John', restrictions: ['peanuts'] },
        { name: 'Jane', restrictions: ['gluten'] }
      ]
    });

    const mealPlan = await generateMealPlan(household);

    expect(mealPlan).not.toContainIngredients(['peanuts', 'gluten']);
    expect(mealPlan.meals).toHaveLength(21); // 7 days × 3 meals
  });
});

// E2E TEST EXAMPLE
test('Complete meal planning flow', async ({ page }) => {
  await page.goto('https://grocery.dwaynecon.com');
  await page.click('[data-testid="start-planning"]');
  await page.fill('[data-testid="chat-input"]',
    'Plan meals for 4 people, $150 budget, no nuts');
  await page.click('[data-testid="send-message"]');

  await expect(page.locator('[data-testid="meal-suggestions"]'))
    .toBeVisible({ timeout: 10000 });
});
```

## 📊 MONITORING & ANALYTICS

```typescript
// TRACK THESE METRICS:
1. Performance Metrics:
   - Page load time < 3s
   - API response time < 200ms
   - AI response time < 5s
   - Database query time < 100ms

2. Business Metrics:
   - User engagement rate
   - Meal plan completion rate
   - Shopping list usage
   - Cart automation success
   - Cost savings achieved

3. Error Tracking:
   - API failure rates
   - AI timeout frequency
   - Database connection issues
   - Payment failures
   - Scraping failures

4. User Analytics:
   - Feature usage patterns
   - Drop-off points
   - Popular meal types
   - Budget distributions
   - Household sizes
```

## 🔄 DEVELOPMENT WORKFLOW

```bash
# DEVELOPMENT COMMANDS

# Install dependencies
npm run install:all

# Development mode
npm run dev          # Runs both frontend and backend

# Testing
npm run test         # Run all tests
npm run test:unit    # Unit tests only
npm run test:e2e     # E2E tests only
npm run test:coverage # Generate coverage report

# Building
npm run build        # Build both frontend and backend
npm run build:client # Frontend only
npm run build:server # Backend only

# Database
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database
npm run db:reset     # Reset and reseed

# Code quality
npm run lint         # ESLint
npm run format       # Prettier
npm run type-check   # TypeScript check

# Deployment
npm run deploy:staging    # Deploy to staging
npm run deploy:production # Deploy to production
```

## 📝 CRITICAL IMPLEMENTATION NOTES

### Must-Have Features for MVP

- ✅ User authentication and household creation
- ✅ AI conversation for meal preferences
- ✅ 7-day meal plan generation
- ✅ Basic dietary restriction handling
- ✅ Shopping list generation
- ✅ Budget tracking
- ✅ Recipe display with instructions
- ✅ Mobile responsive design

### Phase 2 Features

- ⏳ Store deal web scraping
- ⏳ Cart automation
- ⏳ Advanced nutrition tracking
- ⏳ Recipe modifications
- ⏳ Inventory management
- ⏳ Social sharing

### Performance Requirements

- Initial load: < 3 seconds
- AI response: < 5 seconds
- Database queries: < 100ms
- API calls: < 200ms
- 99.9% uptime target

### Compliance Requirements

- GDPR data privacy
- CCPA compliance
- WCAG 2.1 AA accessibility
- PCI DSS for payments
- COPPA for minors

## 🚨 ERROR HANDLING STRATEGY

```typescript
// COMPREHENSIVE ERROR HANDLING:

1. User-Facing Errors:
   - Friendly error messages
   - Suggested actions
   - Retry mechanisms
   - Fallback options
   - Support contact

2. System Errors:
   - Graceful degradation
   - Circuit breakers
   - Retry with exponential backoff
   - Queue failed operations
   - Alert administrators

3. AI Failures:
   - Fallback to simpler model
   - Cached response usage
   - Manual input option
   - Offline mode activation

4. Database Issues:
   - Connection pooling
   - Read replica fallback
   - Query timeout handling
   - Transaction rollbacks
   - Data integrity checks
```

## 🎯 SUCCESS CRITERIA

The application is considered production-ready when:

1. **Functionality**: All core features work without placeholder code
2. **Security**: Passes security audit with no critical vulnerabilities
3. **Performance**: Meets all performance benchmarks
4. **Accessibility**: WCAG 2.1 AA compliant
5. **Testing**: >80% test coverage with all tests passing
6. **Documentation**: Complete API and user documentation
7. **Monitoring**: Error tracking and analytics in place
8. **Deployment**: Successfully deployed to grocery.dwaynecon.com
9. **Legal**: Privacy policy and terms of service active
10. **Support**: Help documentation and contact system ready

## 💡 INNOVATION PRIORITIES

Focus on these game-changing features:

1. **Conversational AI**: Natural, context-aware meal planning
2. **Visual Appeal**: Glass morphism UI with smooth animations
3. **Predictive Planning**: Learn and anticipate user needs
4. **Smart Shopping**: Automated deal finding and cart filling
5. **Health Integration**: Connect with fitness apps
6. **AR Features**: Scan fridge to suggest meals
7. **Voice Control**: Complete hands-free operation
8. **Social Features**: Share meals with friends
9. **Gamification**: Rewards for healthy eating
10. **Sustainability**: Track food waste reduction

---

**REMEMBER**: This is a production application for real users. Every decision should prioritize:

1. **Security** (protect user data)
2. **Reliability** (consistent performance)
3. **Usability** (intuitive interface)
4. **Accessibility** (everyone can use it)
5. **Scalability** (ready for growth)

When in doubt, refer to this document and implement the most secure, user-friendly solution possible.
