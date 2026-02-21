# Cross-Browser Testing Checklist - Grocery20

## Testing Matrix

| Browser | Desktop Version | Mobile Version | Priority |
|---------|----------------|----------------|----------|
| Chrome | Latest (v120+) | Android Chrome | HIGH |
| Safari | Latest (v17+) | iOS Safari 15+ | HIGH |
| Firefox | Latest (v120+) | - | MEDIUM |
| Edge | Latest (v120+) | - | MEDIUM |

## Test Devices

### Desktop
- Windows 10/11 (1920x1080, 1366x768)
- macOS Sonoma/Ventura (2560x1600, 1920x1080)

### Mobile
- iPhone 13/14/15 (iOS 15+)
- Samsung Galaxy S21/22/23 (Android 12+)
- iPad Pro 11" / iPad Air

## Core Functionality Tests

### 1. Authentication & Authorization ✅

**Desktop - All Browsers**
- [ ] Register new account with email/password
- [ ] Form validation displays errors correctly
- [ ] Password strength indicator shows
- [ ] Login with valid credentials
- [ ] Login with invalid credentials shows error
- [ ] Logout redirects to homepage
- [ ] Protected routes redirect to login when not authenticated
- [ ] Session persists after page refresh

**Mobile - iOS Safari & Android Chrome**
- [ ] Touch keyboard appears correctly
- [ ] Password autofill works
- [ ] Face ID / Touch ID integration (if available)
- [ ] Registration form fits viewport without horizontal scroll

### 2. Navigation & Layout ✅

**Desktop**
- [ ] Floating dock navigation displays centered
- [ ] Dock icons highlight active route
- [ ] Dock auto-hides on mouse away (desktop only)
- [ ] Dock indicator appears when hidden
- [ ] Page transitions animate smoothly
- [ ] All routes load without errors

**Mobile**
- [ ] Bottom navigation remains fixed
- [ ] Navigation doesn't overlap content
- [ ] Safe area insets respected (iOS notch)
- [ ] Swipe gestures don't conflict with navigation
- [ ] Touch targets are at least 44x44px

### 3. AI Chat Interface ✅

**Desktop**
- [ ] Chat messages display correctly
- [ ] Streaming text appears character-by-character
- [ ] Typing indicator shows during AI response
- [ ] Voice input button displays
- [ ] Microphone permissions requested correctly
- [ ] Voice transcription appears in real-time
- [ ] Audio visualization pulses during recording
- [ ] Message history scrolls smoothly
- [ ] Emoji reactions work on messages

**Mobile**
- [ ] Chat input expands correctly with keyboard
- [ ] Virtual keyboard doesn't cover messages
- [ ] Voice input works on mobile
- [ ] Pull-to-refresh gesture works
- [ ] Long-press shows message options
- [ ] Scroll performance is smooth with 50+ messages

### 4. Meal Planning ✅

**Desktop - All Browsers**
- [ ] Meal cards display in 3-column grid
- [ ] Hover effects show on meal cards
- [ ] Card images load correctly
- [ ] Meal details expand on click
- [ ] Drag-and-drop to calendar works
- [ ] Calendar shows correct dates
- [ ] Meal type indicators (🌅🌞🌙) display
- [ ] Swap meal option works
- [ ] Save to favorites works

**Mobile**
- [ ] Meal cards stack vertically (1 column)
- [ ] Touch targets are easy to tap
- [ ] Swipe gestures work on cards
- [ ] Meal details modal slides up smoothly
- [ ] Calendar is touch-friendly
- [ ] Pinch-to-zoom disabled (prevents accidental zoom)

### 5. Shopping List ✅

**Desktop**
- [ ] Items grouped by category
- [ ] Checkboxes toggle correctly
- [ ] Checked items move to bottom
- [ ] Add custom items works
- [ ] Edit item quantities works
- [ ] Delete items with confirmation
- [ ] Export to PDF works
- [ ] Email/SMS sharing works
- [ ] Print button opens print dialog

**Mobile**
- [ ] Swipe-to-delete works (iOS style)
- [ ] Checkbox touch targets are large enough
- [ ] Add item button is easily accessible
- [ ] Keyboard doesn't cover input field
- [ ] Share sheet opens correctly (iOS/Android)

### 6. Budget Tracking ✅

**Desktop**
- [ ] Budget progress bar displays correctly
- [ ] Spending charts render (Chart.js/Recharts)
- [ ] Savings summary calculates correctly
- [ ] Historical data loads
- [ ] Date range picker works
- [ ] Export data to CSV works

**Mobile**
- [ ] Charts are responsive and touch-enabled
- [ ] Swipe between time periods works
- [ ] Budget cards stack properly
- [ ] Numbers format correctly (currency, decimals)

### 7. Household Management ✅

**Desktop**
- [ ] Add household member form works
- [ ] Dietary restrictions multi-select works
- [ ] Member avatars display
- [ ] Edit member details works
- [ ] Delete member with confirmation
- [ ] Preference voting system works

**Mobile**
- [ ] Add member form is mobile-friendly
- [ ] Multi-select dropdowns work on mobile
- [ ] Avatar upload from camera/gallery works

### 8. Gamification Features ✅

**Desktop - All Browsers**
- [ ] Streak counter displays correctly
- [ ] Achievement badges show
- [ ] Celebration animations trigger (confetti)
- [ ] Weekly summary modal opens
- [ ] Progress bars animate smoothly
- [ ] Achievement unlock sounds play (if enabled)

**Mobile**
- [ ] Haptic feedback works on achievements (iOS/Android)
- [ ] Animations don't lag on lower-end devices
- [ ] Celebration confetti performs well

### 9. PWA Features ✅

**Desktop**
- [ ] Install prompt appears after 3 days
- [ ] Install button triggers browser prompt
- [ ] App installs successfully
- [ ] Standalone mode works (no browser UI)
- [ ] Service worker caches assets
- [ ] Offline mode shows cached content

**Mobile - iOS Safari**
- [ ] "Add to Home Screen" instructions show
- [ ] PWA installs from Share menu
- [ ] Splash screen displays on launch
- [ ] Status bar styling is correct
- [ ] Safe area insets work properly

**Mobile - Android Chrome**
- [ ] Install prompt appears automatically
- [ ] App installs to home screen
- [ ] App icon and name are correct
- [ ] Splash screen displays
- [ ] Push notifications work (if implemented)

### 10. Performance & Optimization ✅

**Desktop - All Browsers**
- [ ] Initial load < 3 seconds
- [ ] Time to Interactive (TTI) < 4 seconds
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] First Input Delay (FID) < 100ms
- [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] Images lazy-load correctly
- [ ] Route code-splitting works (check Network tab)
- [ ] Bundle size < 500KB (gzipped)

**Mobile**
- [ ] 3G network: Page loads in < 5 seconds
- [ ] Scroll performance: 60fps
- [ ] Touch response < 50ms
- [ ] Battery drain is acceptable during normal use

### 11. Accessibility ✅

**Desktop - All Browsers**
- [ ] Keyboard navigation works (Tab, Enter, Esc)
- [ ] Focus indicators visible
- [ ] Screen reader announces content correctly
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Skip to main content link works
- [ ] ARIA labels present on interactive elements
- [ ] Form errors are announced

**Mobile**
- [ ] VoiceOver (iOS) reads content correctly
- [ ] TalkBack (Android) works
- [ ] Zoom up to 200% without breaking layout
- [ ] Touch targets meet minimum size (44x44px)

### 12. Visual & UX Polish ✅

**Desktop - All Browsers**
- [ ] Glassmorphism effects render correctly
- [ ] Blur effects work (backdrop-filter)
- [ ] Animations are smooth (60fps)
- [ ] Dark mode styling is correct
- [ ] Light mode styling is correct
- [ ] Theme transitions smoothly
- [ ] Custom fonts load correctly
- [ ] Icons display properly (Material Icons)

**Mobile**
- [ ] Touch ripple effects work
- [ ] Pull-to-refresh animation is smooth
- [ ] Swipe gestures feel native
- [ ] Micro-interactions respond instantly

## Browser-Specific Issues to Check

### Safari (Desktop & iOS)
- [ ] Date inputs use Safari date picker
- [ ] Audio playback works without user gesture (if applicable)
- [ ] Service worker registers correctly
- [ ] IndexedDB works for offline storage
- [ ] Backdrop-filter (blur) works on iOS 15+
- [ ] Touch events don't conflict with click events
- [ ] -webkit- prefixes are added where needed

### Chrome (Desktop & Android)
- [ ] Chrome DevTools shows no console errors
- [ ] Lighthouse audit scores > 90
- [ ] beforeinstallprompt event fires correctly
- [ ] Web Share API works on Android
- [ ] Push notifications work (if implemented)

### Firefox
- [ ] All CSS features work (some experimental features may need flags)
- [ ] Service worker updates correctly
- [ ] Font rendering is consistent
- [ ] No mixed content warnings

### Edge
- [ ] All Chromium-based features work
- [ ] Legacy Edge users see upgrade message (if supporting IE11)

## Testing Tools

### Automated Testing
- [ ] Lighthouse CI in GitHub Actions
- [ ] Playwright cross-browser E2E tests
- [ ] Percy visual regression tests (optional)

### Manual Testing Tools
- [ ] BrowserStack for device testing
- [ ] Chrome DevTools Device Mode
- [ ] Firefox Responsive Design Mode
- [ ] Safari Web Inspector
- [ ] React DevTools
- [ ] Redux DevTools

### Performance Testing
- [ ] WebPageTest.org (3G, 4G, Cable)
- [ ] Chrome DevTools Performance tab
- [ ] Chrome DevTools Coverage tab (unused CSS/JS)
- [ ] Bundle Analyzer (npm run bundle-size)

## Test Data Requirements

Create test accounts with:
- [ ] User with 0 meals (new user)
- [ ] User with 7-day meal plan
- [ ] User with 30+ day streak
- [ ] User with budget tracking enabled
- [ ] Household with 4+ members
- [ ] User with dietary restrictions
- [ ] User with 50+ messages in chat

## Known Issues & Workarounds

| Issue | Browser | Workaround | Status |
|-------|---------|------------|--------|
| Backdrop-filter slow on old iOS | iOS < 15 | Fallback to solid color | ✅ |
| Service worker doesn't update | Safari 15.0 | Use skipWaiting() | ✅ |
| - | - | - | - |

## Sign-Off Checklist

Before deploying to production:

- [ ] All HIGH priority tests pass
- [ ] At least 90% of MEDIUM priority tests pass
- [ ] No critical console errors
- [ ] Performance targets met on all browsers
- [ ] Accessibility audit passes
- [ ] Mobile experience tested on real devices
- [ ] PWA installs successfully
- [ ] Offline mode works
- [ ] Analytics tracking verified
- [ ] Error tracking (Sentry) confirmed working

---

**Last Updated:** 2025-01-26
**Tested By:** [Your Name]
**Test Environment:** Local / Staging / Production
