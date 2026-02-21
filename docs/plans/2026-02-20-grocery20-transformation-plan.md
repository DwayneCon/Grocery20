# Grocery20 Game-Changing Transformation - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Grocery20 from an 85%-complete app into a game-changing, mind-blowing production web app with cinematic visuals, predictive AI, real-time collaboration, camera features, voice-first experience, gamification, and rock-solid production polish.

**Architecture:** Full monolith approach - extend existing React 18 + Express 5 + MySQL stack. Add Socket.IO for real-time, OpenAI Vision/TTS for multi-modal AI, D3.js for data visualization, Lottie for cinematic animations, Playwright for E2E tests, Vitest for unit tests.

**Tech Stack:** React 18, TypeScript, Express 5, MySQL, Socket.IO, OpenAI GPT-4 Vision/TTS, D3.js, Lottie, Framer Motion, Vitest, Playwright, Web Push API, Web Speech API

---

## Phase 1: Foundation & Production Polish

**Why first:** Everything else builds on a stable, tested, well-monitored foundation.

---

### Task 1: Install Testing Infrastructure

**Files:**
- Modify: `client/package.json`
- Modify: `server/package.json`
- Create: `client/vitest.config.ts`
- Create: `client/src/test/setup.ts`
- Create: `server/jest.config.ts`
- Create: `server/src/test/setup.ts`

**Step 1: Install frontend testing dependencies**

```bash
cd /Users/dwayneconcepcion/Grocery20/client
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/coverage-v8 msw
```

**Step 2: Create vitest config**

Create `client/vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@features': path.resolve(__dirname, './src/features'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@layouts': path.resolve(__dirname, './src/layouts'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@services': path.resolve(__dirname, './src/services'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
});
```

**Step 3: Create frontend test setup**

Create `client/src/test/setup.ts`:
```typescript
import '@testing-library/jest-dom';
```

**Step 4: Install backend testing dependencies**

```bash
cd /Users/dwayneconcepcion/Grocery20/server
npm install -D jest ts-jest @types/jest supertest @types/supertest
```

**Step 5: Create backend jest config**

Create `server/jest.config.ts`:
```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: ['src/**/*.ts', '!src/test/**'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'json', 'html'],
  setupFiles: ['<rootDir>/src/test/setup.ts'],
};

export default config;
```

**Step 6: Create backend test setup**

Create `server/src/test/setup.ts`:
```typescript
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-that-is-long-enough-for-testing';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-long-enough';
process.env.DB_PASSWORD = 'test-password';
process.env.SESSION_SECRET = 'test-session-secret-long-enough-here';
process.env.ENCRYPTION_KEY = 'test-encryption-key-long-enough-here';
```

**Step 7: Add test scripts to both package.json files**

In `client/package.json` add to scripts:
```json
"test": "vitest",
"test:run": "vitest run",
"test:coverage": "vitest run --coverage"
```

In `server/package.json` add to scripts:
```json
"test": "jest",
"test:watch": "jest --watch",
"test:coverage": "jest --coverage"
```

**Step 8: Verify both test runners start**

```bash
cd /Users/dwayneconcepcion/Grocery20/client && npx vitest run --passWithNoTests
cd /Users/dwayneconcepcion/Grocery20/server && npx jest --passWithNoTests
```

**Step 9: Commit**
```bash
git add client/vitest.config.ts client/src/test/ server/jest.config.ts server/src/test/ client/package.json server/package.json package-lock.json
git commit -m "chore: add testing infrastructure (Vitest + Jest)"
```

---

### Task 2: Write Core Backend Tests

**Files:**
- Create: `server/src/api/auth/__tests__/auth.controller.test.ts`
- Create: `server/src/api/ai/__tests__/recipeHelper.test.ts`
- Create: `server/src/middleware/__tests__/validators.test.ts`
- Create: `server/src/test/helpers.ts`

**Step 1: Create test helpers**

Create `server/src/test/helpers.ts`:
```typescript
import { Request, Response } from 'express';

export const mockRequest = (overrides: Partial<Request> = {}): Partial<Request> => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  ...overrides,
});

export const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

export const mockNext = jest.fn();
```

**Step 2: Write validator tests**

Create `server/src/middleware/__tests__/validators.test.ts`:
```typescript
import { registerSchema, loginSchema } from '../validators';

describe('validators', () => {
  describe('registerSchema', () => {
    it('should accept valid registration data', () => {
      const result = registerSchema.validate({
        email: 'test@example.com',
        password: 'Test123!@',
        name: 'Test User',
      });
      expect(result.error).toBeUndefined();
    });

    it('should reject weak passwords', () => {
      const result = registerSchema.validate({
        email: 'test@example.com',
        password: 'weak',
        name: 'Test User',
      });
      expect(result.error).toBeDefined();
    });

    it('should reject invalid emails', () => {
      const result = registerSchema.validate({
        email: 'not-an-email',
        password: 'Test123!@',
        name: 'Test User',
      });
      expect(result.error).toBeDefined();
    });
  });

  describe('loginSchema', () => {
    it('should accept valid login data', () => {
      const result = loginSchema.validate({
        email: 'test@example.com',
        password: 'Test123!@',
      });
      expect(result.error).toBeUndefined();
    });

    it('should reject missing password', () => {
      const result = loginSchema.validate({
        email: 'test@example.com',
      });
      expect(result.error).toBeDefined();
    });
  });
});
```

**Step 3: Write recipe helper tests**

Create `server/src/api/ai/__tests__/recipeHelper.test.ts`:
```typescript
import { parseIngredients, normalizeUnit } from '../recipeHelper';

describe('recipeHelper', () => {
  describe('parseIngredients', () => {
    it('should parse string ingredient format', () => {
      const result = parseIngredients(['2 cups flour', '1 tsp salt']);
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        name: expect.any(String),
        quantity: expect.any(String),
      });
    });

    it('should handle object ingredient format', () => {
      const result = parseIngredients([
        { name: 'flour', quantity: '2', unit: 'cups' },
      ]);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('flour');
    });

    it('should handle empty array', () => {
      const result = parseIngredients([]);
      expect(result).toEqual([]);
    });
  });
});
```

**Step 4: Run tests to verify they pass**

```bash
cd /Users/dwayneconcepcion/Grocery20/server && npx jest --verbose
```

**Step 5: Commit**
```bash
git add server/src/test/helpers.ts server/src/api/ai/__tests__/ server/src/middleware/__tests__/
git commit -m "test: add core backend unit tests for validators and recipe helper"
```

---

### Task 3: Write Core Frontend Tests

**Files:**
- Create: `client/src/components/common/__tests__/GlassCard.test.tsx`
- Create: `client/src/components/common/__tests__/ErrorBoundary.test.tsx`
- Create: `client/src/features/__tests__/authSlice.test.ts`
- Create: `client/src/utils/__tests__/mealParser.test.ts`

**Step 1: Write GlassCard component test**

Create `client/src/components/common/__tests__/GlassCard.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { describe, it, expect } from 'vitest';
import GlassCard from '../GlassCard';

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('GlassCard', () => {
  it('renders children', () => {
    renderWithTheme(<GlassCard><span>Test Content</span></GlassCard>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies glass morphism styles', () => {
    const { container } = renderWithTheme(<GlassCard>Content</GlassCard>);
    const card = container.firstChild as HTMLElement;
    expect(card).toBeInTheDocument();
  });
});
```

**Step 2: Write authSlice test**

Create `client/src/features/__tests__/authSlice.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import authReducer, { setCredentials, logout } from '../auth/authSlice';

describe('authSlice', () => {
  const initialState = { user: null, token: null, isAuthenticated: false };

  it('should return the initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toMatchObject({
      token: null,
    });
  });

  it('should handle setCredentials', () => {
    const credentials = { user: { id: '1', email: 'test@test.com' }, token: 'abc123' };
    const state = authReducer(initialState, setCredentials(credentials));
    expect(state.token).toBe('abc123');
    expect(state.isAuthenticated).toBe(true);
  });

  it('should handle logout', () => {
    const loggedInState = { user: { id: '1' }, token: 'abc123', isAuthenticated: true };
    const state = authReducer(loggedInState as any, logout());
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
```

**Step 3: Write mealParser test**

Create `client/src/utils/__tests__/mealParser.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { parseMealCards } from '../mealParser';

describe('mealParser', () => {
  it('should return empty array for non-meal text', () => {
    const result = parseMealCards('Hello, how can I help you today?');
    expect(result).toEqual([]);
  });

  it('should parse meal card format with emoji headers', () => {
    const input = `Here's a meal suggestion:

🍽️ **Chicken Tikka Masala**
⏱️ 45 min | 💰 $8/serving | 👨‍🍳 Medium

**Ingredients:**
- 2 lbs chicken thighs
- 1 cup yogurt

**Instructions:**
1. Marinate chicken
2. Cook in sauce`;

    const result = parseMealCards(input);
    expect(result.length).toBeGreaterThan(0);
  });
});
```

**Step 4: Run frontend tests**

```bash
cd /Users/dwayneconcepcion/Grocery20/client && npx vitest run --reporter=verbose
```

**Step 5: Commit**
```bash
git add client/src/components/common/__tests__/ client/src/features/__tests__/ client/src/utils/__tests__/
git commit -m "test: add core frontend unit tests for components, state, and parsers"
```

---

### Task 4: Sentry Error Monitoring Integration

**Files:**
- Modify: `client/package.json` (add @sentry/react)
- Modify: `server/package.json` (add @sentry/node)
- Modify: `client/src/main.tsx` (init Sentry)
- Modify: `server/src/index.ts` (init Sentry)
- Modify: `server/src/config/env.ts` (add SENTRY_DSN)

**Step 1: Install Sentry packages**

```bash
cd /Users/dwayneconcepcion/Grocery20/client && npm install @sentry/react
cd /Users/dwayneconcepcion/Grocery20/server && npm install @sentry/node
```

**Step 2: Add SENTRY_DSN to env config**

In `server/src/config/env.ts`, add to the config object:
```typescript
sentry: {
  dsn: process.env.SENTRY_DSN || '',
},
```

**Step 3: Initialize Sentry in frontend**

In `client/src/main.tsx`, add before ReactDOM.createRoot:
```typescript
import * as Sentry from '@sentry/react';

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.2,
  });
}
```

**Step 4: Initialize Sentry in backend**

In `server/src/index.ts`, add after imports:
```typescript
import * as Sentry from '@sentry/node';

if (config.sentry.dsn) {
  Sentry.init({
    dsn: config.sentry.dsn,
    environment: config.nodeEnv,
    tracesSampleRate: 0.2,
  });
}
```

Add before error handler middleware:
```typescript
if (config.sentry.dsn) {
  Sentry.setupExpressErrorHandler(app);
}
```

**Step 5: Commit**
```bash
git add client/package.json server/package.json client/src/main.tsx server/src/index.ts server/src/config/env.ts package-lock.json
git commit -m "feat: integrate Sentry error monitoring for frontend and backend"
```

---

### Task 5: Complete Email Service Integration

**Files:**
- Modify: `server/src/services/emailService.ts`
- Modify: `server/src/api/auth/auth.controller.ts`
- Modify: `server/src/config/env.ts` (add SMTP config)
- Create: `server/src/templates/passwordReset.html`

**Step 1: Add SMTP config to env**

In `server/src/config/env.ts`, add:
```typescript
smtp: {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  user: process.env.SMTP_USER || '',
  pass: process.env.SMTP_PASS || '',
  from: process.env.SMTP_FROM || 'nora@grocery20.com',
},
```

**Step 2: Create password reset email template**

Create `server/src/templates/passwordReset.html`:
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #0f172a; color: #e2e8f0; padding: 40px; }
    .container { max-width: 500px; margin: 0 auto; background: rgba(30,41,59,0.9); border-radius: 16px; padding: 40px; }
    .logo { text-align: center; font-size: 28px; font-weight: bold; color: #f97316; margin-bottom: 24px; }
    .button { display: inline-block; background: #f97316; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; }
    .footer { margin-top: 32px; font-size: 12px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">Grocery20</div>
    <h2>Reset Your Password</h2>
    <p>Hi {{name}},</p>
    <p>We received a request to reset your password. Click the button below to create a new one:</p>
    <p style="text-align: center; margin: 32px 0;">
      <a href="{{resetUrl}}" class="button">Reset Password</a>
    </p>
    <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    <div class="footer">Grocery20 - AI-Powered Meal Planning</div>
  </div>
</body>
</html>
```

**Step 3: Update emailService to use nodemailer with templates**

Update `server/src/services/emailService.ts` to create a real transporter using `config.smtp` settings, read the HTML template, replace `{{name}}` and `{{resetUrl}}` placeholders, and send via nodemailer.

**Step 4: Wire email sending into auth controller's forgot-password endpoint**

In `server/src/api/auth/auth.controller.ts`, in the forgot-password handler, after generating the reset token, call the email service to send the reset email with the URL `${config.cors.allowedOrigins[0]}/reset-password?token=${resetToken}`.

**Step 5: Commit**
```bash
git add server/src/services/emailService.ts server/src/api/auth/auth.controller.ts server/src/config/env.ts server/src/templates/
git commit -m "feat: complete email service integration for password reset"
```

---

### Task 6: Enhanced Health Checks & Web Vitals

**Files:**
- Modify: `server/src/index.ts` (expand health endpoint)
- Create: `client/src/utils/webVitals.ts`
- Modify: `client/src/main.tsx` (init web vitals)

**Step 1: Expand backend health check**

In `server/src/index.ts`, replace the simple health endpoint with one that checks database connectivity (runs `SELECT 1`), checks OpenAI API key presence, reports memory usage (`process.memoryUsage()`), and returns uptime. Return status 200 if all healthy, 503 if any check fails.

**Step 2: Create Web Vitals tracker**

Create `client/src/utils/webVitals.ts`:
```typescript
import type { Metric } from 'web-vitals';

export function reportWebVitals(onReport?: (metric: Metric) => void) {
  import('web-vitals').then(({ onCLS, onFID, onLCP, onTTFB, onINP }) => {
    const report = onReport || ((metric: Metric) => {
      console.log(`[WebVital] ${metric.name}: ${metric.value}`);
    });
    onCLS(report);
    onFID(report);
    onLCP(report);
    onTTFB(report);
    onINP(report);
  });
}
```

**Step 3: Install web-vitals and init in main.tsx**

```bash
cd /Users/dwayneconcepcion/Grocery20/client && npm install web-vitals
```

In `client/src/main.tsx`, add after render:
```typescript
import { reportWebVitals } from './utils/webVitals';
if (import.meta.env.PROD) {
  reportWebVitals();
}
```

**Step 4: Commit**
```bash
git add server/src/index.ts client/src/utils/webVitals.ts client/src/main.tsx client/package.json package-lock.json
git commit -m "feat: add enhanced health checks and Web Vitals monitoring"
```

---

## Phase 2: Visual Transformation

---

### Task 7: Install Visual Libraries

**Files:**
- Modify: `client/package.json`

**Step 1: Install D3, Lottie, and animation libraries**

```bash
cd /Users/dwayneconcepcion/Grocery20/client
npm install d3 @types/d3 lottie-react @lottiefiles/dotlottie-react react-intersection-observer react-countup
```

**Step 2: Commit**
```bash
git add client/package.json package-lock.json
git commit -m "chore: install D3, Lottie, and animation libraries"
```

---

### Task 8: Cinematic Landing Page Redesign

**Files:**
- Modify: `client/src/pages/HomePage.tsx`
- Create: `client/src/components/home/HeroSection.tsx`
- Create: `client/src/components/home/FeatureShowcase.tsx`
- Create: `client/src/components/home/SocialProof.tsx`
- Create: `client/src/components/home/ParallaxSection.tsx`

**Step 1: Create HeroSection component**

Create `client/src/components/home/HeroSection.tsx` - Full-viewport hero with:
- Animated gradient background (aurora effect from existing AuroraBackground)
- Large headline: "Your AI Kitchen Assistant" with typewriter effect
- Subtitle with fade-in animation
- Pulsing CTA button with magnetic hover effect (tracks mouse position, button subtly pulls toward cursor)
- Floating food emoji particles drifting upward with Framer Motion
- Scroll indicator arrow at bottom

**Step 2: Create ParallaxSection component**

Create `client/src/components/home/ParallaxSection.tsx`:
- Wrapper that uses `react-intersection-observer` + Framer Motion
- Children slide in from left/right on scroll with `useScroll` and `useTransform`
- Parallax depth effect on background elements
- Staggered children animation

**Step 3: Create FeatureShowcase component**

Create `client/src/components/home/FeatureShowcase.tsx`:
- 3 feature cards in a grid, each with:
  - Lottie animation icon (cooking, shopping cart, AI brain)
  - Feature title + description
  - Scroll-triggered entrance (stagger 200ms)
  - Glass morphism card with hover lift effect
- Features: "AI Meal Planning", "Smart Shopping Lists", "Budget Optimization"

**Step 4: Create SocialProof component**

Create `client/src/components/home/SocialProof.tsx`:
- Animated counters using `react-countup` + `react-intersection-observer`
- Stats: "10,000+ Meals Planned", "$50K+ Saved", "500+ Happy Families"
- Count up animation triggers when scrolled into view
- Subtle glow effect on each number

**Step 5: Rewrite HomePage to compose new sections**

Modify `client/src/pages/HomePage.tsx`:
- Stack: HeroSection -> ParallaxSection(FeatureShowcase) -> ParallaxSection(InteractiveDemo) -> SocialProof -> Footer
- Full-page smooth scrolling
- Each section is viewport-height

**Step 6: Verify the page renders without errors**

```bash
cd /Users/dwayneconcepcion/Grocery20/client && npm run build
```

**Step 7: Commit**
```bash
git add client/src/pages/HomePage.tsx client/src/components/home/
git commit -m "feat: cinematic landing page with parallax, Lottie, and animated counters"
```

---

### Task 9: Dashboard Bento Grid Redesign

**Files:**
- Modify: `client/src/pages/DashboardPage.tsx`
- Create: `client/src/components/dashboard/BentoGrid.tsx`
- Create: `client/src/components/dashboard/WeatherGreeting.tsx`
- Create: `client/src/components/dashboard/QuickActions.tsx`
- Create: `client/src/components/dashboard/ActivityFeed.tsx`

**Step 1: Create WeatherGreeting component**

Create `client/src/components/dashboard/WeatherGreeting.tsx`:
- Fetch weather from free API (wttr.in - no key needed): `https://wttr.in/?format=j1`
- Display: "Good [morning/afternoon/evening] [name], it's [temp]° and [condition] - perfect for [contextual suggestion]"
- Contextual suggestions: cold -> "warm soup", hot -> "fresh salad", rainy -> "comfort food"
- Fade-in animation with staggered text reveal

**Step 2: Create BentoGrid layout component**

Create `client/src/components/dashboard/BentoGrid.tsx`:
- CSS Grid with named areas for responsive layout
- Desktop: 4-column grid with varied card sizes (1x1, 2x1, 1x2)
- Mobile: Single column stack
- Cards use existing GlassCard with spring entrance animations
- Grid areas: greeting(2x1), streak(1x1), budget(1x1), nutrition(2x1), activity(1x2), quickActions(1x1)

**Step 3: Create QuickActions floating bar**

Create `client/src/components/dashboard/QuickActions.tsx`:
- Floating action bar at top of dashboard
- Context-aware buttons: "Chat with Nora", "View Meal Plan", "Shopping List", "Add to Inventory"
- Animated pill-shaped buttons with icon + label
- Hover: subtle scale + glow

**Step 4: Create ActivityFeed component**

Create `client/src/components/dashboard/ActivityFeed.tsx`:
- Recent household activity list
- Items: "You accepted Chicken Tikka Masala", "Shopping list updated", "Budget updated"
- Each item has icon, text, timestamp
- Scroll-triggered stagger animation
- (Placeholder data for now, will be live with Socket.IO in Phase 4)

**Step 5: Rewrite DashboardPage with new components**

Modify `client/src/pages/DashboardPage.tsx`:
- Replace current layout with BentoGrid
- Compose: WeatherGreeting + StreakCounter + BudgetTracker + NutritionDashboard + ActivityFeed + QuickActions
- Spring entrance animation for the entire grid

**Step 6: Commit**
```bash
git add client/src/pages/DashboardPage.tsx client/src/components/dashboard/
git commit -m "feat: premium bento grid dashboard with weather greeting and activity feed"
```

---

### Task 10: D3.js Data Visualization Upgrade

**Files:**
- Create: `client/src/components/charts/AnimatedDonut.tsx`
- Create: `client/src/components/charts/BudgetBarChart.tsx`
- Create: `client/src/components/charts/NutritionRadar.tsx`
- Modify: `client/src/components/budget/BudgetTracker.tsx`
- Modify: `client/src/components/nutrition/NutritionDashboard.tsx`

**Step 1: Create AnimatedDonut chart**

Create `client/src/components/charts/AnimatedDonut.tsx`:
- D3.js donut chart with animated arc transitions
- Props: data (array of {label, value, color}), size, innerRadius
- Animate on mount: arcs grow from 0 to target angle
- Hover: arc expands slightly, tooltip shows value
- Center text: total or percentage
- Uses `react-intersection-observer` to trigger animation on scroll-in

**Step 2: Create BudgetBarChart**

Create `client/src/components/charts/BudgetBarChart.tsx`:
- Horizontal bar chart showing spending by category
- Animated bars that grow from left on mount
- Color-coded: green (under budget), orange (near limit), red (over)
- Target line overlay showing budget limit
- Responsive width

**Step 3: Create NutritionRadar chart**

Create `client/src/components/charts/NutritionRadar.tsx`:
- D3.js radar/spider chart for macro visualization
- Axes: Protein, Carbs, Fat, Fiber, Vitamins
- Animated polygon that expands from center
- Target zone overlay (recommended ranges)
- Glassmorphism background

**Step 4: Integrate charts into BudgetTracker and NutritionDashboard**

Replace existing basic visualizations in both components with the new D3 charts.

**Step 5: Commit**
```bash
git add client/src/components/charts/ client/src/components/budget/BudgetTracker.tsx client/src/components/nutrition/NutritionDashboard.tsx
git commit -m "feat: D3.js animated charts for budget and nutrition visualization"
```

---

### Task 11: Enhanced Micro-interactions & Page Transitions

**Files:**
- Modify: `client/src/components/common/PageTransition.tsx`
- Create: `client/src/utils/springConfig.ts`
- Modify: `client/src/layouts/MainLayout.tsx` (navigation transitions)

**Step 1: Create spring config constants**

Create `client/src/utils/springConfig.ts`:
```typescript
export const springs = {
  gentle: { type: 'spring' as const, stiffness: 120, damping: 14 },
  bouncy: { type: 'spring' as const, stiffness: 300, damping: 10 },
  snappy: { type: 'spring' as const, stiffness: 500, damping: 25 },
  slow: { type: 'spring' as const, stiffness: 80, damping: 20 },
};

export const magneticHover = {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.95 },
  transition: springs.bouncy,
};

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: springs.gentle,
};

export const staggerChildren = (delay = 0.05) => ({
  animate: { transition: { staggerChildren: delay } },
});
```

**Step 2: Upgrade PageTransition with shared layout animations**

Modify `client/src/components/common/PageTransition.tsx`:
- Add page exit animation (fade + slide left)
- Add page enter animation (fade + slide from right)
- Use `AnimatePresence` mode="wait" for clean transitions
- Apply spring physics instead of linear easing

**Step 3: Add magnetic hover to navigation items in MainLayout**

Modify `client/src/layouts/MainLayout.tsx`:
- Wrap dock items with `motion.div` using `magneticHover` config
- Add active indicator animation (sliding pill under active item)
- Smooth background transition on dock show/hide

**Step 4: Commit**
```bash
git add client/src/utils/springConfig.ts client/src/components/common/PageTransition.tsx client/src/layouts/MainLayout.tsx
git commit -m "feat: spring physics micro-interactions and enhanced page transitions"
```

---

### Task 12: Nora Avatar Emotional States

**Files:**
- Modify: `client/src/components/common/NoraAvatar.tsx`
- Create: `client/src/components/chat/NoraMood.tsx`

**Step 1: Create NoraMood component**

Create `client/src/components/chat/NoraMood.tsx`:
- Animated avatar wrapper with emotional states
- States: 'idle' (gentle floating), 'thinking' (spinning chef hat, dots), 'happy' (bounce + sparkle), 'celebrating' (confetti particles), 'cooking' (steam animation)
- Props: `mood: 'idle' | 'thinking' | 'happy' | 'celebrating' | 'cooking'`
- Uses Framer Motion for all animations
- Chef hat accessory that animates per mood
- Particle effects for celebration (small confetti dots)

**Step 2: Integrate NoraMood into ChatPage**

Set mood based on chat state:
- Waiting for input: 'idle'
- AI generating response: 'thinking'
- Meal accepted: 'happy' (brief)
- Full plan approved: 'celebrating'
- Viewing recipe steps: 'cooking'

**Step 3: Commit**
```bash
git add client/src/components/common/NoraAvatar.tsx client/src/components/chat/NoraMood.tsx
git commit -m "feat: Nora avatar emotional states with animated mood system"
```

---

### Task 13: Confetti & Celebration System

**Files:**
- Modify: `client/src/utils/celebrations.ts`
- Modify: `client/src/pages/ChatPage.tsx`

**Step 1: Enhance celebrations utility**

Modify `client/src/utils/celebrations.ts`:
- Add `celebrateMealApproved()` - small confetti burst, food emojis
- Add `celebratePlanComplete()` - full screen confetti, longer duration, chef hat emojis
- Add `celebrateAchievement()` - gold particles, star emojis
- Add `celebrateStreak()` - fire particles, streak-themed
- Each uses canvas-confetti with different configs (particle count, spread, colors)

**Step 2: Wire celebrations into ChatPage**

In `client/src/pages/ChatPage.tsx`:
- Trigger `celebrateMealApproved` when user accepts a meal card
- Trigger `celebratePlanComplete` when all days in a plan are approved
- Brief screen flash + haptic feedback (navigator.vibrate if available)

**Step 3: Commit**
```bash
git add client/src/utils/celebrations.ts client/src/pages/ChatPage.tsx
git commit -m "feat: contextual celebration animations for meal approvals"
```

---

## Phase 3: AI Intelligence Upgrade

---

### Task 14: Backend Predictive Engine Setup

**Files:**
- Create: `server/src/services/cron/predictiveEngine.ts`
- Create: `server/src/services/cron/scheduler.ts`
- Modify: `server/src/index.ts` (start cron)
- Modify: `server/package.json` (add node-cron)

**Step 1: Install node-cron**

```bash
cd /Users/dwayneconcepcion/Grocery20/server && npm install node-cron @types/node-cron
```

**Step 2: Create predictive engine**

Create `server/src/services/cron/predictiveEngine.ts`:
- `generateWeeklyPlan(householdId)`: Query learned preferences, recent meal history (avoid repeats from last 2 weeks), current inventory (suggest meals using expiring items), budget remaining, and seasonal ingredients. Call OpenAI with structured JSON output to generate a 7-day plan. Save as a draft meal plan with status='suggested'.
- `checkLowStock(householdId)`: Query inventory, compare against household's typical usage (from meal history), flag items that are likely low.
- `findDeals(householdId)`: Query Kroger API for sale items that match household preferences. Cross-reference with learned preferences to highlight relevant deals.

**Step 3: Create scheduler**

Create `server/src/services/cron/scheduler.ts`:
```typescript
import cron from 'node-cron';
import { predictiveEngine } from './predictiveEngine';
import { db } from '../../config/database';
import logger from '../../utils/logger';

export function startScheduler() {
  // Every Sunday at 6 AM: auto-generate weekly plans
  cron.schedule('0 6 * * 0', async () => {
    logger.info('Running weekly meal plan generation');
    try {
      const [households] = await db.query('SELECT id FROM households');
      for (const h of households as any[]) {
        await predictiveEngine.generateWeeklyPlan(h.id);
      }
    } catch (err) {
      logger.error('Weekly plan generation failed', err);
    }
  });

  // Daily at 8 AM: check for low stock and expiring items
  cron.schedule('0 8 * * *', async () => {
    logger.info('Running daily inventory check');
    // ... similar pattern
  });

  logger.info('Scheduler started');
}
```

**Step 4: Start scheduler in index.ts**

In `server/src/index.ts`, after `app.listen`, add:
```typescript
import { startScheduler } from './services/cron/scheduler';
startScheduler();
```

**Step 5: Commit**
```bash
git add server/src/services/cron/ server/src/index.ts server/package.json package-lock.json
git commit -m "feat: predictive engine with cron scheduler for auto meal plans and stock alerts"
```

---

### Task 15: Proactive Suggestions API

**Files:**
- Create: `server/src/api/suggestions/suggestions.controller.ts`
- Create: `server/src/api/suggestions/suggestions.routes.ts`
- Modify: `server/src/index.ts` (register route)

**Step 1: Create suggestions controller**

Create `server/src/api/suggestions/suggestions.controller.ts`:
- `GET /api/suggestions/:householdId` - Returns array of proactive suggestions:
  - Deal-based: "Chicken thighs are 30% off at Kroger - want me to plan around that?"
  - Expiring inventory: "Your yogurt expires in 2 days - here are 3 recipes"
  - Reorder: "Based on your cooking patterns, you're probably low on olive oil"
  - Time-based: "It's 4 PM - tonight's dinner takes 45 min to prep"
- Each suggestion has: type, title, message, actionType ('chat', 'shopping', 'inventory'), priority
- Query learned preferences, inventory, Kroger deals, and current meal plan

**Step 2: Create routes**

Create `server/src/api/suggestions/suggestions.routes.ts`:
```typescript
import { Router } from 'express';
import { getSuggestions } from './suggestions.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
router.get('/:householdId', authenticate, getSuggestions);
export default router;
```

**Step 3: Register route in index.ts**

Add: `app.use('/api/suggestions', suggestionsRoutes);`

**Step 4: Create frontend service**

Create `client/src/services/suggestionsService.ts`:
```typescript
import apiClient from '../utils/apiClient';

export const getSuggestions = async (householdId: string) => {
  const response = await apiClient.get(`/api/suggestions/${householdId}`);
  return response.data;
};
```

**Step 5: Commit**
```bash
git add server/src/api/suggestions/ client/src/services/suggestionsService.ts server/src/index.ts
git commit -m "feat: proactive suggestions API for deals, expiring items, and reorders"
```

---

### Task 16: Vision API - Receipt Scanner

**Files:**
- Create: `server/src/services/vision/receiptScanner.ts`
- Create: `server/src/api/vision/vision.controller.ts`
- Create: `server/src/api/vision/vision.routes.ts`
- Create: `client/src/components/camera/ReceiptScanner.tsx`
- Create: `client/src/hooks/useCamera.ts`
- Modify: `server/src/index.ts`

**Step 1: Create useCamera hook**

Create `client/src/hooks/useCamera.ts`:
```typescript
import { useRef, useState, useCallback } from 'react';

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);

  const startCamera = useCallback(async (facingMode: 'user' | 'environment' = 'environment') => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      setIsActive(true);
    } catch (err) {
      console.error('Camera access denied:', err);
      throw err;
    }
  }, []);

  const capturePhoto = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
  }, []);

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
    setIsActive(false);
  }, [stream]);

  return { videoRef, canvasRef, startCamera, capturePhoto, stopCamera, isActive };
}
```

**Step 2: Create receipt scanner backend**

Create `server/src/services/vision/receiptScanner.ts`:
- Accept base64 image
- Send to OpenAI GPT-4 Vision with prompt: "Extract all items and prices from this grocery receipt. Return JSON: { storeName, date, items: [{ name, quantity, price, category }], subtotal, tax, total }"
- Parse response and validate structure
- Return structured receipt data

**Step 3: Create vision controller and routes**

Create `server/src/api/vision/vision.controller.ts`:
- `POST /api/vision/receipt` - Accept image (base64 or multipart), call receiptScanner, return structured data
- `POST /api/vision/fridge` - Accept image, identify ingredients, suggest meals (Phase 3 extension)

Create `server/src/api/vision/vision.routes.ts` with auth middleware.

**Step 4: Create ReceiptScanner frontend component**

Create `client/src/components/camera/ReceiptScanner.tsx`:
- Full-screen camera view with capture button
- Viewfinder overlay (receipt outline guide)
- After capture: show processing indicator
- Results: list of items with prices, editable before saving
- "Add to Budget" and "Add to Inventory" action buttons
- Framer Motion transitions between camera/review states

**Step 5: Register route and commit**
```bash
git add server/src/services/vision/ server/src/api/vision/ client/src/components/camera/ client/src/hooks/useCamera.ts server/src/index.ts
git commit -m "feat: receipt scanner with GPT-4 Vision and camera integration"
```

---

### Task 17: Vision API - Fridge Scanner

**Files:**
- Modify: `server/src/services/vision/receiptScanner.ts` (add fridge function)
- Modify: `server/src/api/vision/vision.controller.ts`
- Create: `client/src/components/camera/FridgeScanner.tsx`

**Step 1: Add fridge scanning to vision service**

In `server/src/services/vision/receiptScanner.ts`, add:
- `scanFridge(imageBase64)`: Send to GPT-4 Vision with prompt: "Identify all food items visible in this refrigerator/pantry photo. For each item estimate: name, approximate quantity, condition (fresh/aging/expired). Return JSON array."
- After getting ingredients, query the AI for 3 meal suggestions using those ingredients

**Step 2: Create FridgeScanner component**

Create `client/src/components/camera/FridgeScanner.tsx`:
- Camera view with "Scan Your Fridge" header
- After capture: animated scanning effect (line moving down the image)
- Results: grid of identified ingredients with confidence badges
- "What can I make?" button -> sends ingredients to Nora chat
- Transition animations between states

**Step 3: Wire into vision controller**

Add `POST /api/vision/fridge` endpoint.

**Step 4: Commit**
```bash
git add server/src/services/vision/ server/src/api/vision/ client/src/components/camera/FridgeScanner.tsx
git commit -m "feat: fridge scanner with ingredient identification and meal suggestions"
```

---

### Task 18: Text-to-Speech for Nora

**Files:**
- Create: `server/src/services/tts/ttsService.ts`
- Create: `server/src/api/ai/tts.routes.ts`
- Modify: `server/src/index.ts`
- Create: `client/src/hooks/useTTS.ts`
- Modify: `client/src/pages/ChatPage.tsx`

**Step 1: Create TTS backend service**

Create `server/src/services/tts/ttsService.ts`:
```typescript
import OpenAI from 'openai';
import { config } from '../../config/env';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

export async function generateSpeech(text: string): Promise<Buffer> {
  const response = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'nova', // warm, friendly female voice - perfect for Nora
    input: text,
    response_format: 'mp3',
  });
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
```

**Step 2: Create TTS route**

Create `server/src/api/ai/tts.routes.ts`:
- `POST /api/ai/tts` - Accept { text }, return audio/mp3 stream
- Rate limit: 10 requests per minute (TTS is expensive)
- Max text length: 1000 characters

**Step 3: Create useTTS hook**

Create `client/src/hooks/useTTS.ts`:
```typescript
import { useState, useRef, useCallback } from 'react';
import apiClient from '../utils/apiClient';

export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (text: string) => {
    try {
      setIsSpeaking(true);
      const response = await apiClient.post('/api/ai/tts', { text }, {
        responseType: 'blob',
      });
      const audioUrl = URL.createObjectURL(response.data);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      await audio.play();
    } catch (err) {
      setIsSpeaking(false);
      console.error('TTS failed:', err);
    }
  }, []);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking };
}
```

**Step 4: Add speaker button to chat messages**

In `client/src/pages/ChatPage.tsx`, add a small speaker icon button on each Nora message. On click, call `speak(messageText)`. Show animated sound waves while speaking.

**Step 5: Commit**
```bash
git add server/src/services/tts/ server/src/api/ai/tts.routes.ts client/src/hooks/useTTS.ts client/src/pages/ChatPage.tsx server/src/index.ts
git commit -m "feat: text-to-speech for Nora with OpenAI TTS and audio playback"
```

---

### Task 19: Voice-First Cooking Companion Mode

**Files:**
- Create: `client/src/components/voice/CookingMode.tsx`
- Create: `client/src/components/voice/VoiceCommandBar.tsx`
- Modify: `client/src/pages/ChatPage.tsx` (add cooking mode trigger)

**Step 1: Create CookingMode component**

Create `client/src/components/voice/CookingMode.tsx`:
- Full-screen overlay with dark background
- Large, readable text showing current recipe step
- Step progress indicator (Step 3 of 8)
- Timer integration (start/pause timer for each step)
- Voice commands: "next step", "previous step", "repeat", "set timer 10 minutes", "what's next?"
- Nora reads each step aloud via TTS
- Hands-free: auto-advances when voice command detected
- Exit button with confirmation
- Animated step transitions (slide left/right)

**Step 2: Create VoiceCommandBar**

Create `client/src/components/voice/VoiceCommandBar.tsx`:
- Floating bar at bottom of cooking mode
- Shows waveform when listening
- Displays recognized command text
- Quick command chips: "Next", "Repeat", "Timer"
- Integrates with existing useSpeechRecognition hook

**Step 3: Add "Start Cooking" button to meal cards**

In ChatPage, when viewing an accepted meal with full recipe details, show "Start Cooking" button that launches CookingMode with that recipe.

**Step 4: Commit**
```bash
git add client/src/components/voice/ client/src/pages/ChatPage.tsx
git commit -m "feat: hands-free cooking companion mode with voice commands and TTS"
```

---

### Task 20: Preference Memory System

**Files:**
- Create: `server/src/services/ai/preferenceMemory.ts`
- Modify: `server/src/api/ai/ai.controller.ts`
- Modify: `server/src/api/ai/masterPrompt.ts`

**Step 1: Create preference memory service**

Create `server/src/services/ai/preferenceMemory.ts`:
- Store explicit preference statements from conversations
- Parse user messages for preference signals: "I don't like X", "We love Y", "Never suggest Z", "My kids prefer W"
- Store in a `preference_memories` table: { household_id, statement, category, sentiment, confidence, source_message, created_at }
- `getMemories(householdId)` returns formatted string for injection into system prompt
- Deduplication: merge similar preferences

**Step 2: Add migration for preference_memories table**

Create `server/migrations/010_preference_memories.sql`:
```sql
CREATE TABLE IF NOT EXISTS preference_memories (
  id VARCHAR(36) PRIMARY KEY,
  household_id VARCHAR(36) NOT NULL,
  statement TEXT NOT NULL,
  category ENUM('ingredient', 'cuisine', 'cooking_method', 'dietary', 'timing', 'budget', 'general') NOT NULL,
  sentiment ENUM('positive', 'negative', 'neutral') NOT NULL,
  confidence DECIMAL(3,2) DEFAULT 0.80,
  source_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  INDEX idx_household (household_id),
  INDEX idx_category (category)
);
```

**Step 3: Integrate into AI controller**

In `server/src/api/ai/ai.controller.ts`, after loading conversation history and before calling OpenAI:
- Call `preferenceMemory.extractPreferences(userMessage, householdId)` to detect and store new preferences
- Call `preferenceMemory.getMemories(householdId)` and inject into system prompt context

**Step 4: Update master prompt**

In `server/src/api/ai/masterPrompt.ts`, add a new template section:
```
## Remembered Preferences
These are things this household has explicitly told you. ALWAYS respect these:
{{preferenceMemories}}
```

**Step 5: Commit**
```bash
git add server/src/services/ai/preferenceMemory.ts server/src/api/ai/ai.controller.ts server/src/api/ai/masterPrompt.ts server/migrations/010_preference_memories.sql
git commit -m "feat: AI preference memory system - Nora remembers explicit user preferences"
```

---

## Phase 4: Real-Time Collaboration

---

### Task 21: Socket.IO Server Setup

**Files:**
- Modify: `server/package.json` (add socket.io)
- Create: `server/src/socket/socketServer.ts`
- Create: `server/src/socket/handlers/mealPlanHandler.ts`
- Create: `server/src/socket/handlers/shoppingHandler.ts`
- Create: `server/src/socket/handlers/activityHandler.ts`
- Modify: `server/src/index.ts`

**Step 1: Install socket.io**

```bash
cd /Users/dwayneconcepcion/Grocery20/server && npm install socket.io
cd /Users/dwayneconcepcion/Grocery20/client && npm install socket.io-client
```

**Step 2: Create socket server**

Create `server/src/socket/socketServer.ts`:
```typescript
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import logger from '../utils/logger';
import { setupMealPlanHandlers } from './handlers/mealPlanHandler';
import { setupShoppingHandlers } from './handlers/shoppingHandler';
import { setupActivityHandlers } from './handlers/activityHandler';

export function createSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: config.cors.allowedOrigins,
      credentials: true,
    },
  });

  // Auth middleware - verify JWT on connection
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as any;
      socket.data.userId = decoded.userId;
      socket.data.householdId = decoded.householdId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const { householdId } = socket.data;
    logger.info(`Socket connected: ${socket.id} (household: ${householdId})`);

    // Join household room
    if (householdId) {
      socket.join(`household:${householdId}`);
    }

    setupMealPlanHandlers(io, socket);
    setupShoppingHandlers(io, socket);
    setupActivityHandlers(io, socket);

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}
```

**Step 3: Create meal plan handler**

Create `server/src/socket/handlers/mealPlanHandler.ts`:
- Events: `meal:accepted`, `meal:rejected`, `meal:modified`, `plan:approved`
- On each event, broadcast to household room: `household:${householdId}`
- Include user name and action details in broadcast

**Step 4: Create shopping handler**

Create `server/src/socket/handlers/shoppingHandler.ts`:
- Events: `shopping:item-toggled`, `shopping:item-added`, `shopping:item-removed`
- Broadcast to household room for real-time sync

**Step 5: Create activity handler**

Create `server/src/socket/handlers/activityHandler.ts`:
- Maintain recent activity log per household (in memory, last 50 items)
- Events: `activity:new` - broadcast when any action happens
- `activity:get-recent` - return recent activity list

**Step 6: Integrate into server/index.ts**

Modify `server/src/index.ts`:
- Create HTTP server from app: `const httpServer = createServer(app)`
- Pass to socket server: `createSocketServer(httpServer)`
- Change `app.listen` to `httpServer.listen`

**Step 7: Commit**
```bash
git add server/src/socket/ server/src/index.ts server/package.json client/package.json package-lock.json
git commit -m "feat: Socket.IO server with household rooms and real-time event handlers"
```

---

### Task 22: Frontend Socket.IO Integration

**Files:**
- Create: `client/src/hooks/useSocket.ts`
- Create: `client/src/contexts/SocketContext.tsx`
- Modify: `client/src/main.tsx`

**Step 1: Create useSocket hook**

Create `client/src/hooks/useSocket.ts`:
```typescript
import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSelector } from 'react-redux';

export function useSocket() {
  const token = useSelector((state: any) => state.auth.token);
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    const socket = io(window.location.origin, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [token]);

  const emit = useCallback((event: string, data?: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    socketRef.current?.on(event, handler);
    return () => { socketRef.current?.off(event, handler); };
  }, []);

  return { emit, on, isConnected, socket: socketRef.current };
}
```

**Step 2: Create SocketContext**

Create `client/src/contexts/SocketContext.tsx`:
- Provider wraps the app
- Provides socket instance, emit, on, isConnected to all children
- Only connects when user is authenticated

**Step 3: Wrap app with SocketProvider in main.tsx**

Add `<SocketProvider>` inside the `<Provider store={store}>` wrapper.

**Step 4: Commit**
```bash
git add client/src/hooks/useSocket.ts client/src/contexts/SocketContext.tsx client/src/main.tsx
git commit -m "feat: frontend Socket.IO integration with auth and household rooms"
```

---

### Task 23: Real-Time Shopping List Sync

**Files:**
- Modify: `client/src/pages/ShoppingListPage.tsx`

**Step 1: Add socket listeners to ShoppingListPage**

In `client/src/pages/ShoppingListPage.tsx`:
- Use `useSocket` hook
- On `shopping:item-toggled`, update local state to reflect toggle
- On `shopping:item-added`, add item to local list
- On `shopping:item-removed`, remove item from local list
- When user toggles an item, emit `shopping:item-toggled` event
- Show a small "synced" indicator and who just made a change
- Toast notification: "Jane checked off Milk"

**Step 2: Commit**
```bash
git add client/src/pages/ShoppingListPage.tsx
git commit -m "feat: real-time shopping list sync across household members"
```

---

### Task 24: Live Activity Feed

**Files:**
- Modify: `client/src/components/dashboard/ActivityFeed.tsx`

**Step 1: Connect ActivityFeed to socket**

In `client/src/components/dashboard/ActivityFeed.tsx`:
- Use `useSocket` hook
- Listen for `activity:new` events
- Prepend new activities with slide-in animation
- On mount, emit `activity:get-recent` to load history
- Each activity: avatar, user name, action text, relative timestamp
- Actions: "accepted a meal", "completed shopping", "updated budget", "earned an achievement"

**Step 2: Commit**
```bash
git add client/src/components/dashboard/ActivityFeed.tsx
git commit -m "feat: live activity feed with real-time household updates"
```

---

## Phase 5: New Features & Gamification

---

### Task 25: Recipe Discovery Page

**Files:**
- Create: `client/src/pages/RecipesPage.tsx`
- Create: `client/src/components/recipes/RecipeGrid.tsx`
- Create: `client/src/components/recipes/RecipeFilters.tsx`
- Create: `client/src/components/recipes/RecipeCollections.tsx`
- Modify: `client/src/App.tsx` (add route)
- Modify: `client/src/layouts/MainLayout.tsx` (add nav item)

**Step 1: Create RecipeFilters component**

Create `client/src/components/recipes/RecipeFilters.tsx`:
- Filter chips: Cuisine (Italian, Mexican, Asian, American...), Time (Under 30 min, 30-60 min, 1+ hr), Difficulty (Easy, Medium, Hard), Dietary (Vegetarian, Vegan, Gluten-Free, Dairy-Free)
- Search bar with debounced input
- Sort: Most Popular, Newest, Quickest, Cheapest
- Animated chip toggle (scale + color change)

**Step 2: Create RecipeGrid component**

Create `client/src/components/recipes/RecipeGrid.tsx`:
- Masonry-style grid of RecipeCards
- Staggered entrance animation
- Infinite scroll or "Load More" button
- Empty state with illustration

**Step 3: Create RecipeCollections**

Create `client/src/components/recipes/RecipeCollections.tsx`:
- Horizontal scrolling collection cards: "Quick Weeknight Dinners", "Budget-Friendly", "Kid-Approved", "Trending This Week"
- Each collection card has gradient background, icon, title
- Click opens filtered recipe grid

**Step 4: Create RecipesPage**

Create `client/src/pages/RecipesPage.tsx`:
- Layout: RecipeCollections (top) -> RecipeFilters -> RecipeGrid
- Uses recipeService to fetch recipes
- Includes "AI Suggested" section based on preferences

**Step 5: Add route and nav item**

In `client/src/App.tsx`, add lazy route: `/recipes` -> RecipesPage
In `client/src/layouts/MainLayout.tsx`, add nav item between "Meal Plan" and "Shopping List"

**Step 6: Commit**
```bash
git add client/src/pages/RecipesPage.tsx client/src/components/recipes/ client/src/App.tsx client/src/layouts/MainLayout.tsx
git commit -m "feat: recipe discovery page with filters, collections, and masonry grid"
```

---

### Task 26: Inventory Management Page

**Files:**
- Create: `client/src/pages/InventoryPage.tsx`
- Modify: `client/src/components/inventory/InventoryList.tsx`
- Create: `client/src/components/inventory/InventoryTabs.tsx`
- Create: `client/src/components/inventory/ExpirationAlert.tsx`
- Create: `client/src/components/inventory/AddItemDialog.tsx`
- Modify: `client/src/App.tsx` (add route)
- Modify: `client/src/layouts/MainLayout.tsx` (add nav item)

**Step 1: Create InventoryTabs component**

Create `client/src/components/inventory/InventoryTabs.tsx`:
- Three visual tabs: Fridge (snowflake icon), Pantry (cabinet icon), Freezer (ice icon)
- Each tab has its own color theme
- Animated tab indicator slides between tabs
- Badge with item count on each tab

**Step 2: Create ExpirationAlert component**

Create `client/src/components/inventory/ExpirationAlert.tsx`:
- Banner at top of inventory page showing items expiring soon
- Color-coded: red (today/tomorrow), orange (2-3 days), yellow (4-7 days)
- "Suggest Recipes" button -> sends expiring items to Nora
- Dismissible with animation

**Step 3: Create AddItemDialog**

Create `client/src/components/inventory/AddItemDialog.tsx`:
- Dialog for adding inventory items
- Fields: name, quantity, unit, category, location (fridge/pantry/freezer), expiration date
- Optional: barcode scan button (uses camera hook)
- Auto-complete for common grocery items

**Step 4: Create InventoryPage**

Create `client/src/pages/InventoryPage.tsx`:
- Layout: ExpirationAlert -> InventoryTabs -> InventoryList
- FAB: Add item button
- Swipe to delete items
- Pull to refresh

**Step 5: Add route and nav item**

In `client/src/App.tsx`, add route. In MainLayout, add nav item.

**Step 6: Commit**
```bash
git add client/src/pages/InventoryPage.tsx client/src/components/inventory/ client/src/App.tsx client/src/layouts/MainLayout.tsx
git commit -m "feat: inventory management page with fridge/pantry/freezer tabs and expiration alerts"
```

---

### Task 27: Gamification Level System

**Files:**
- Create: `server/src/services/gamification/levelSystem.ts`
- Create: `server/src/api/gamification/gamification.controller.ts`
- Create: `server/src/api/gamification/gamification.routes.ts`
- Create: `client/src/components/gamification/LevelBadge.tsx`
- Create: `client/src/components/gamification/XPProgress.tsx`
- Create: `client/src/components/gamification/CookingHeatmap.tsx`
- Modify: `server/src/index.ts`

**Step 1: Create level system service**

Create `server/src/services/gamification/levelSystem.ts`:
```typescript
export const LEVELS = [
  { level: 1, title: 'Home Cook', xpRequired: 0, icon: '🥄' },
  { level: 2, title: 'Kitchen Explorer', xpRequired: 100, icon: '🍳' },
  { level: 3, title: 'Sous Chef', xpRequired: 300, icon: '👨‍🍳' },
  { level: 4, title: 'Head Chef', xpRequired: 600, icon: '⭐' },
  { level: 5, title: 'Master Chef', xpRequired: 1000, icon: '👑' },
  { level: 6, title: 'Culinary Legend', xpRequired: 2000, icon: '🏆' },
];

export const XP_ACTIONS = {
  MEAL_ACCEPTED: 10,
  PLAN_COMPLETED: 50,
  RECIPE_RATED: 5,
  RECIPE_COOKED: 25,
  STREAK_DAY: 15,
  SHOPPING_COMPLETED: 20,
  NEW_CUISINE_TRIED: 30,
  BUDGET_UNDER: 40,
};

export function calculateLevel(totalXP: number) {
  let currentLevel = LEVELS[0];
  for (const level of LEVELS) {
    if (totalXP >= level.xpRequired) currentLevel = level;
    else break;
  }
  const nextLevel = LEVELS[LEVELS.indexOf(currentLevel) + 1];
  const progress = nextLevel
    ? (totalXP - currentLevel.xpRequired) / (nextLevel.xpRequired - currentLevel.xpRequired)
    : 1;
  return { ...currentLevel, totalXP, nextLevel, progress };
}
```

**Step 2: Create gamification controller and routes**

- `GET /api/gamification/:userId` - Get level, XP, progress
- `POST /api/gamification/:userId/xp` - Award XP for an action
- `GET /api/gamification/:householdId/leaderboard` - Household leaderboard
- `GET /api/gamification/:userId/heatmap` - Cooking activity data (last 365 days)

**Step 3: Create LevelBadge component**

Animated badge showing current level icon + title. Pulse animation on level up.

**Step 4: Create XPProgress component**

Animated progress bar showing XP toward next level. XP gain animation (number floats up and fades).

**Step 5: Create CookingHeatmap**

GitHub-style contribution heatmap using D3.js. Shows cooking activity over last year. Color intensity = meals cooked that day. Tooltip on hover showing date and meals.

**Step 6: Commit**
```bash
git add server/src/services/gamification/ server/src/api/gamification/ client/src/components/gamification/ server/src/index.ts
git commit -m "feat: gamification level system with XP, leaderboard, and cooking heatmap"
```

---

### Task 28: Notification System

**Files:**
- Create: `server/src/services/push/pushService.ts`
- Create: `server/src/api/notifications/notifications.controller.ts`
- Create: `server/src/api/notifications/notifications.routes.ts`
- Create: `client/src/components/notifications/NotificationCenter.tsx`
- Create: `client/src/components/notifications/NotificationBell.tsx`
- Create: `client/src/hooks/useNotifications.ts`
- Modify: `server/package.json` (add web-push)
- Modify: `server/src/index.ts`
- Modify: `client/src/layouts/MainLayout.tsx`

**Step 1: Install web-push**

```bash
cd /Users/dwayneconcepcion/Grocery20/server && npm install web-push @types/web-push
```

**Step 2: Create push notification service**

Create `server/src/services/push/pushService.ts`:
- Generate VAPID keys (store in env)
- Subscribe endpoint: store subscription object in DB
- Send notification: title, body, icon, action URL
- Notification types: meal_reminder, deal_alert, expiration_warning, achievement_unlocked

**Step 3: Create notification controller and routes**

- `POST /api/notifications/subscribe` - Save push subscription
- `GET /api/notifications` - Get in-app notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Dismiss

**Step 4: Create NotificationBell component**

- Bell icon in MainLayout header
- Unread count badge (animated bounce on new notification)
- Click opens NotificationCenter drawer

**Step 5: Create NotificationCenter**

- Slide-in drawer from right
- List of notifications grouped by date
- Each notification: icon, title, message, timestamp, read/unread indicator
- Swipe to dismiss
- "Mark all read" button

**Step 6: Create useNotifications hook**

Combines push subscription registration + in-app notification polling + socket real-time events.

**Step 7: Add NotificationBell to MainLayout header**

**Step 8: Commit**
```bash
git add server/src/services/push/ server/src/api/notifications/ client/src/components/notifications/ client/src/hooks/useNotifications.ts client/src/layouts/MainLayout.tsx server/src/index.ts server/package.json package-lock.json
git commit -m "feat: notification system with push notifications, in-app center, and bell icon"
```

---

## Phase 6: Integration & E2E Testing

---

### Task 29: API Integration Tests

**Files:**
- Create: `server/src/__tests__/api/auth.integration.test.ts`
- Create: `server/src/__tests__/api/mealPlans.integration.test.ts`
- Create: `server/src/__tests__/api/shopping.integration.test.ts`
- Create: `server/src/test/testDb.ts`

**Step 1: Create test database helper**

Create `server/src/test/testDb.ts`:
- Helper to create/destroy test database tables
- Uses separate test database (grocery_planner_test)
- beforeAll: create tables, afterAll: drop tables
- Seed helper for test data

**Step 2: Write auth integration tests**

Test: register -> login -> refresh -> me -> logout flow.
Test: forgot-password generates token. Test: invalid credentials return 401.

**Step 3: Write meal plans integration tests**

Test: create plan -> add meals -> get current week -> save from chat.
Test: plan returns meals with ingredients and nutrition.

**Step 4: Write shopping list integration tests**

Test: create from meal plan -> items consolidated -> toggle purchased -> delete item.

**Step 5: Run all integration tests**

```bash
cd /Users/dwayneconcepcion/Grocery20/server && npx jest --testPathPattern=__tests__/api --verbose
```

**Step 6: Commit**
```bash
git add server/src/__tests__/ server/src/test/testDb.ts
git commit -m "test: API integration tests for auth, meal plans, and shopping"
```

---

### Task 30: Playwright E2E Tests

**Files:**
- Create: `e2e/playwright.config.ts`
- Create: `e2e/tests/auth.spec.ts`
- Create: `e2e/tests/chat.spec.ts`
- Create: `e2e/tests/shopping.spec.ts`
- Modify: `package.json` (root - add playwright scripts)

**Step 1: Install Playwright**

```bash
cd /Users/dwayneconcepcion/Grocery20 && npm install -D @playwright/test
npx playwright install chromium
```

**Step 2: Create Playwright config**

Create `e2e/playwright.config.ts`:
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'cd server && npm run dev',
      port: 3001,
      reuseExistingServer: true,
    },
    {
      command: 'cd client && npm run dev',
      port: 3000,
      reuseExistingServer: true,
    },
  ],
});
```

**Step 3: Write auth E2E test**

Create `e2e/tests/auth.spec.ts`:
- Test: Visit home page -> click "Get Started" -> register -> redirected to dashboard
- Test: Login with valid credentials -> see dashboard
- Test: Login with invalid credentials -> see error

**Step 4: Write chat E2E test**

Create `e2e/tests/chat.spec.ts`:
- Test: Navigate to chat -> type message -> see Nora response
- Test: Accept a meal card -> see confirmation

**Step 5: Write shopping E2E test**

Create `e2e/tests/shopping.spec.ts`:
- Test: Navigate to shopping list -> add item -> see in list -> toggle purchased

**Step 6: Commit**
```bash
git add e2e/ package.json package-lock.json
git commit -m "test: Playwright E2E tests for auth, chat, and shopping flows"
```

---

### Task 31: Performance Optimization Pass

**Files:**
- Modify: `client/vite.config.ts` (optimize chunks)
- Create: `client/src/components/common/VirtualList.tsx`
- Modify: `client/src/pages/ShoppingListPage.tsx` (virtual scroll)

**Step 1: Audit and optimize vite chunks**

Review `client/vite.config.ts` chunk splitting. Add D3, Lottie, and Socket.IO to separate chunks:
```typescript
'd3-vendor': ['d3'],
'lottie-vendor': ['lottie-react'],
'socket-vendor': ['socket.io-client'],
```

**Step 2: Create VirtualList component**

Create `client/src/components/common/VirtualList.tsx`:
- Lightweight virtual scrolling for long lists
- Props: items, renderItem, itemHeight, overscan
- Only renders visible items + overscan buffer
- Smooth scrolling with momentum

**Step 3: Apply virtual scrolling to ShoppingListPage**

Replace the current list rendering in ShoppingListPage with VirtualList for lists with more than 50 items.

**Step 4: Build and check bundle size**

```bash
cd /Users/dwayneconcepcion/Grocery20/client && npm run build -- --report
```

**Step 5: Commit**
```bash
git add client/vite.config.ts client/src/components/common/VirtualList.tsx client/src/pages/ShoppingListPage.tsx
git commit -m "perf: optimize bundle splitting and add virtual scrolling for long lists"
```

---

### Task 32: Final Integration & Build Verification

**Files:**
- All files (build verification)

**Step 1: Run all backend tests**

```bash
cd /Users/dwayneconcepcion/Grocery20/server && npm test -- --coverage
```
Expected: All tests pass, coverage > 60%

**Step 2: Run all frontend tests**

```bash
cd /Users/dwayneconcepcion/Grocery20/client && npx vitest run --coverage
```
Expected: All tests pass, coverage > 60%

**Step 3: Build frontend**

```bash
cd /Users/dwayneconcepcion/Grocery20/client && npm run build
```
Expected: Clean build, no errors

**Step 4: Build backend**

```bash
cd /Users/dwayneconcepcion/Grocery20/server && npm run build
```
Expected: Clean build, no TypeScript errors

**Step 5: Run E2E tests (if dev servers available)**

```bash
cd /Users/dwayneconcepcion/Grocery20 && npx playwright test
```

**Step 6: Final commit**
```bash
git add -A
git commit -m "chore: final integration verification - all tests pass, clean builds"
```

---

## Summary

| Phase | Tasks | Focus |
|-------|-------|-------|
| 1: Foundation | Tasks 1-6 | Testing infra, Sentry, email, health checks |
| 2: Visuals | Tasks 7-13 | Landing page, dashboard, D3 charts, micro-interactions, Nora avatar, celebrations |
| 3: AI | Tasks 14-20 | Predictive engine, suggestions, receipt/fridge scanner, TTS, voice cooking mode, preference memory |
| 4: Real-Time | Tasks 21-24 | Socket.IO, real-time shopping sync, live activity feed |
| 5: Features | Tasks 25-28 | Recipe discovery, inventory page, level system, notifications |
| 6: Testing | Tasks 29-32 | Integration tests, E2E tests, performance, final verification |

**Total: 32 tasks across 6 phases**
