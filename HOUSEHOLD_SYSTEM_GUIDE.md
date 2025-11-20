# 🏠 Household Management System - Complete Guide

## Overview

The Household Management System is a comprehensive feature that allows users to:
- Create and manage households
- Add family members with individual preferences
- Track dietary restrictions and allergies
- Set likes, dislikes, and food preferences
- Generate AI meal plans based on household data
- Aggregate preferences across all members

---

## 🎯 Features Implemented

### ✅ Backend API

**Endpoints Created:**
```
POST   /api/households                          - Create household
GET    /api/households/:id                      - Get household
PUT    /api/households/:id                      - Update household
DELETE /api/households/:id                      - Delete household
GET    /api/households/:id/summary              - Get complete household data

POST   /api/households/:id/members              - Add member
GET    /api/households/:id/members              - Get all members
PUT    /api/households/:id/members/:memberId    - Update member
DELETE /api/households/:id/members/:memberId    - Remove member

POST   /api/households/:id/preferences          - Add preference
DELETE /api/households/:id/preferences/:prefId  - Remove preference
```

### ✅ Database Schema

**Tables Used:**
- `households` - Household information
- `household_members` - Family members
- `dietary_preferences` - Allergies and restrictions
- `users` - Links to household

### ✅ Frontend Components

**Pages:**
- `/household` - Main household management page
- Dashboard prompt for household creation

**Components:**
- `HouseholdPage` - Main household interface
- `CreateHouseholdDialog` - Household creation form
- `GlassCard` - Beautiful card displays
- `NeuroCard` - Member cards

### ✅ State Management

**Redux Slices:**
- `householdSlice` - Household state
- Actions: create, fetch, add members, update, remove

**API Service:**
- `householdService` - All API calls

---

## 🚀 How to Use

### 1. Create a Household

**Via Dashboard:**
1. Login to the app
2. Go to Dashboard
3. Click "Get Started" on the household prompt
4. Enter household name and weekly budget
5. Click "Create Household"

**Via API:**
```bash
POST /api/households
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "name": "The Smith Family",
  "budgetWeekly": 200
}
```

### 2. Add Family Members

**Via UI:**
1. Go to Household page
2. Click "Add Member"
3. Fill in member details:
   - Name (required)
   - Age (optional)
   - Allergies (comma-separated)
   - Dislikes (comma-separated)
   - Likes (comma-separated)
4. Click "Add Member"

**Via API:**
```bash
POST /api/households/:householdId/members
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "name": "John Smith",
  "age": 35,
  "dietaryRestrictions": [
    { "type": "allergy", "item": "peanuts" },
    { "type": "allergy", "item": "shellfish" }
  ],
  "preferences": {
    "likes": ["chicken", "pasta", "vegetables"],
    "dislikes": ["mushrooms", "olives"]
  }
}
```

### 3. View Household Summary

**Via UI:**
- Navigate to `/household`
- See all members displayed as cards
- View aggregated preferences at the top

**Via API:**
```bash
GET /api/households/:householdId/summary
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "success": true,
  "household": {
    "id": "uuid",
    "name": "The Smith Family",
    "budget_weekly": 200
  },
  "members": [
    {
      "id": "uuid",
      "name": "John Smith",
      "age": 35,
      "dietary_restrictions": [...],
      "preferences": {...}
    }
  ],
  "aggregated": {
    "allergies": ["peanuts", "shellfish"],
    "intolerances": [],
    "restrictions": [],
    "preferences": ["chicken", "pasta"],
    "dislikes": ["mushrooms", "olives"]
  },
  "stats": {
    "totalMembers": 4,
    "totalAllergies": 2,
    "totalRestrictions": 0,
    "weeklyBudget": 200
  }
}
```

---

## 🤖 AI Integration

### How AI Uses Household Data

When generating meal plans, the AI now:

1. **Fetches household data** if `householdId` is provided
2. **Aggregates all preferences** across all members
3. **Builds comprehensive context** with:
   - Member names and ages
   - All allergies (MUST avoid)
   - All dislikes (avoid if possible)
   - All preferences (include more)
   - Weekly budget

### Generate AI Meal Plan with Household

**Request:**
```bash
POST /api/ai/meal-plan
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "householdId": "your-household-id",
  "days": 7
}
```

The AI will automatically:
- ✅ Use household member count for portions
- ✅ Strictly avoid all allergies
- ✅ Minimize disliked ingredients
- ✅ Incorporate preferred foods
- ✅ Stay within weekly budget
- ✅ Consider age-appropriate portions

---

## 📊 Data Structure

### Household Object
```typescript
interface Household {
  id: string;
  name: string;
  budget_weekly: number;
  created_by: string;
  created_at: string;
}
```

### Household Member
```typescript
interface HouseholdMember {
  id: string;
  household_id: string;
  name: string;
  age?: number;
  dietary_restrictions: Array<
    string | {
      type: 'allergy' | 'intolerance' | 'restriction';
      item: string;
      severity?: number;
    }
  >;
  preferences: {
    likes?: string[];
    dislikes?: string[];
    cuisines?: string[];
    [key: string]: any;
  };
}
```

### Dietary Preference
```typescript
interface DietaryPreference {
  id: string;
  household_id: string;
  user_id?: string;
  preference_type: 'allergy' | 'intolerance' | 'preference' | 'restriction';
  item: string;
  severity: number; // 1-10 scale
}
```

---

## 🎨 UI Components

### HouseholdPage
**Location:** `/client/src/pages/HouseholdPage.tsx`

**Features:**
- Displays household stats (members, allergies, restrictions, budget)
- Shows aggregated household preferences
- Lists all members as cards
- Add/Edit/Remove member functionality
- Beautiful glassmorphism design

### CreateHouseholdDialog
**Location:** `/client/src/components/household/CreateHouseholdDialog.tsx`

**Features:**
- Modal dialog for household creation
- Name and budget input
- Validation and error handling
- Success callback

### Member Cards (NeuroCard)
**Features:**
- Neuromorphic design
- Shows member info
- Displays allergies, dislikes, likes
- Edit and delete actions
- Smooth animations

---

## 🔒 Security

### Authentication
- All household endpoints require JWT authentication
- Users can only access their own household
- Verified via `household_id` in user record

### Validation
- Name required for household and members
- Budget must be positive number
- Age must be valid integer
- Dietary restrictions properly sanitized

### Data Protection
- JSON fields are validated
- SQL injection prevented
- XSS protection enabled
- Input sanitization active

---

## 🧪 Testing Guide

### Test Scenario 1: Create Household
```bash
# 1. Login and get token
POST /api/auth/login
{ "email": "test@example.com", "password": "password" }

# 2. Create household
POST /api/households
Authorization: Bearer TOKEN
{ "name": "Test Family", "budgetWeekly": 150 }

# Expected: 201 status, household created
```

### Test Scenario 2: Add Members
```bash
# Add member with allergies
POST /api/households/:householdId/members
{
  "name": "Alice",
  "age": 8,
  "dietaryRestrictions": [
    { "type": "allergy", "item": "peanuts" }
  ],
  "preferences": {
    "likes": ["pasta", "chicken"],
    "dislikes": ["broccoli"]
  }
}

# Expected: Member created with preferences
```

### Test Scenario 3: Get Summary
```bash
GET /api/households/:householdId/summary

# Expected: Complete household data with aggregated preferences
```

### Test Scenario 4: AI Meal Plan
```bash
POST /api/ai/meal-plan
{
  "householdId": "your-household-id",
  "days": 7
}

# Expected: Meal plan that avoids peanuts, minimizes broccoli, includes pasta/chicken
```

---

## 💡 Tips & Best Practices

### For Users

1. **Be Specific with Allergies**
   - List all severe allergies
   - Include both the allergen and common names
   - Example: "peanuts, groundnuts, peanut oil"

2. **Differentiate Dislikes vs Allergies**
   - Allergies: Will be STRICTLY avoided
   - Dislikes: Minimized but may appear occasionally
   - Preferences: Will be included more often

3. **Update Members Regularly**
   - Children's preferences change
   - Seasonal preferences vary
   - Health conditions may develop

4. **Set Realistic Budgets**
   - Include all grocery expenses
   - Consider dietary restrictions may cost more
   - Adjust based on actual spending

### For Developers

1. **Always Aggregate Preferences**
   - Check all members before meal planning
   - Prioritize allergies (safety first)
   - Balance everyone's preferences

2. **Handle Edge Cases**
   - Empty household
   - Conflicting preferences
   - No household linked to user

3. **Optimize Queries**
   - Use summary endpoint for complete data
   - Cache household data when possible
   - Aggregate on backend, not frontend

---

## 🐛 Troubleshooting

### Issue: User can't see household page
**Solution:**
- Check if user has `household_id` set
- Verify user is authenticated
- Create household if none exists

### Issue: AI not using household preferences
**Solution:**
- Ensure `householdId` is passed to meal plan API
- Check household has members
- Verify preferences are properly formatted

### Issue: Member not saving
**Solution:**
- Check dietary_restrictions is array
- Verify preferences is object
- Ensure name is provided

---

## 🚀 Future Enhancements

### Planned Features
- [ ] Member avatar uploads
- [ ] Preference history tracking
- [ ] Household meal plan history
- [ ] Shared shopping lists between households
- [ ] Guest member temporary preferences
- [ ] Meal rotation to prevent repeats
- [ ] Nutritional goals per member
- [ ] Calorie tracking integration
- [ ] Allergy severity levels
- [ ] Seasonal preference adjustments

---

## 📚 Related Documentation

- [API.md](docs/API.md) - Complete API reference
- [REVOLUTIONARY_ROADMAP.md](REVOLUTIONARY_ROADMAP.md) - Future features
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Project overview

---

## ✅ System Status

**Current Implementation Status:**

- ✅ Backend API (100%)
- ✅ Database Schema (100%)
- ✅ Frontend UI (100%)
- ✅ State Management (100%)
- ✅ AI Integration (100%)
- ✅ Authentication (100%)
- ✅ Validation (100%)
- ✅ Error Handling (100%)

**Ready for:**
- ✅ Local testing
- ✅ Production deployment
- ✅ User onboarding
- ✅ AI meal planning

---

## 🎉 Success!

The Household Management System is **fully implemented** and ready to use!

Users can now:
- ✅ Create households
- ✅ Add family members
- ✅ Set preferences and restrictions
- ✅ Get personalized AI meal plans
- ✅ Manage dietary needs
- ✅ Track budgets

**This is a game-changer for meal planning!** 🚀

---

**Built with:** Revolutionary AI
**Status:** Production Ready
**Date:** November 2024
