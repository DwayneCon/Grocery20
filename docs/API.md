# API Documentation

Base URL: `http://localhost:3001/api`

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-token>
```

### Register User

**POST** `/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:** `201 Created`
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token"
}
```

**Errors:**
- `400` - Validation error or user already exists
- `500` - Server error

---

### Login

**POST** `/auth/login`

Authenticate a user and receive tokens.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:** `200 OK`
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "householdId": "uuid-or-null"
  },
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token"
}
```

**Errors:**
- `401` - Invalid credentials
- `500` - Server error

---

### Refresh Token

**POST** `/auth/refresh`

Get a new access token using a refresh token.

**Request Body:**
```json
{
  "refreshToken": "your-refresh-token"
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "new-jwt-token"
}
```

**Errors:**
- `400` - Refresh token required
- `401` - Invalid refresh token
- `404` - User not found

---

### Logout

**POST** `/auth/logout` 🔒

Invalidate the refresh token.

**Request Body:**
```json
{
  "refreshToken": "your-refresh-token"
}
```

**Response:** `200 OK`
```json
{
  "message": "Logout successful"
}
```

---

### Get Current User

**GET** `/auth/me` 🔒

Get the currently authenticated user's information.

**Response:** `200 OK`
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "householdId": "uuid-or-null",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Errors:**
- `401` - Not authenticated
- `404` - User not found

---

## AI Services

### Chat with AI

**POST** `/ai/chat` 🔒

Send a message to the AI assistant for meal planning advice.

**Request Body:**
```json
{
  "message": "I need help planning meals for 4 people with a $150 budget",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Previous message"
    },
    {
      "role": "assistant",
      "content": "Previous response"
    }
  ]
}
```

**Response:** `200 OK`
```json
{
  "response": "AI assistant's response text",
  "usage": {
    "prompt_tokens": 100,
    "completion_tokens": 150,
    "total_tokens": 250
  }
}
```

**Errors:**
- `400` - Message is required
- `401` - Not authenticated
- `500` - OpenAI API error

---

### Generate Meal Plan

**POST** `/ai/meal-plan` 🔒

Generate a structured meal plan using AI.

**Request Body:**
```json
{
  "householdSize": 4,
  "budget": 150,
  "dietaryRestrictions": ["gluten-free", "no nuts"],
  "cuisinePreferences": ["Italian", "Mexican"],
  "days": 7
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "mealPlan": [
      {
        "day": "Monday",
        "meals": {
          "breakfast": {
            "name": "Oatmeal with Berries",
            "ingredients": ["oats", "berries", "honey"],
            "prepTime": "10 minutes",
            "cost": 5.50
          },
          "lunch": {
            "name": "Chicken Caesar Salad",
            "ingredients": ["chicken", "romaine", "parmesan"],
            "prepTime": "20 minutes",
            "cost": 12.00
          },
          "dinner": {
            "name": "Baked Salmon with Vegetables",
            "ingredients": ["salmon", "broccoli", "carrots"],
            "prepTime": "35 minutes",
            "cost": 18.50
          }
        }
      }
    ],
    "shoppingList": [
      {
        "item": "Chicken Breast",
        "quantity": "2 lbs",
        "estimatedCost": 12.00,
        "category": "Meat"
      }
    ],
    "totalEstimatedCost": 145.00,
    "nutritionSummary": {
      "averageCaloriesPerDay": 2000,
      "proteinGrams": 120,
      "carbsGrams": 200,
      "fatGrams": 65
    }
  },
  "usage": {
    "prompt_tokens": 200,
    "completion_tokens": 800,
    "total_tokens": 1000
  }
}
```

**Errors:**
- `401` - Not authenticated
- `500` - Failed to generate meal plan

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message description"
}
```

In development mode, errors also include a stack trace:

```json
{
  "error": "Error message description",
  "stack": "Error stack trace..."
}
```

## Rate Limiting

- General endpoints: 100 requests per 15 minutes per IP
- Auth endpoints: 5 requests per 15 minutes per IP

Rate limit exceeded response:
```json
{
  "error": "Too many requests from this IP, please try again later."
}
```

## Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

---

🔒 = Requires authentication
