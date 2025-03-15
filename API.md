# Parenting Assistant API Documentation

## Authentication

All API endpoints require Firebase Authentication. Include the Firebase ID token in the Authorization header:

```http
Authorization: Bearer your-firebase-id-token
```

### Getting a Firebase Token

1. **Web Applications**:

```javascript
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get token
const token = await firebase.auth().currentUser.getIdToken();
```

2. **iOS Applications**:

```swift
// Get token
Auth.auth().currentUser?.getIDToken { token, error in
    guard let token = token else { return }
    // Use token in API requests
}
```

### Rate Limits

- General API: 100 requests per 15 minutes
- AI Endpoints: 50 requests per hour per user

## Endpoints

### 1. Generate Meal Plan

Generate personalized meal plans based on dietary preferences and ingredients.

**Endpoint:** `POST /api/generate-meal-plan`

#### Request Examples

1. **Basic Meal Plan**:

```http
POST /api/generate-meal-plan
Content-Type: application/json
Authorization: Bearer your-firebase-id-token

{
  "daysCount": 1,
  "mealsPerDay": 2
}
```

2. **Vegetarian Meal Plan**:

```http
POST /api/generate-meal-plan
Content-Type: application/json
Authorization: Bearer your-firebase-id-token

{
  "dietaryPreferences": ["vegetarian", "gluten-free"],
  "ingredients": ["quinoa", "chickpeas", "sweet potato"],
  "daysCount": 3,
  "mealsPerDay": 2
}
```

3. **Kid-Friendly Meal Plan**:

```http
POST /api/generate-meal-plan
Content-Type: application/json
Authorization: Bearer your-firebase-id-token

{
  "dietaryPreferences": ["kid-friendly", "nut-free"],
  "ingredients": ["pasta", "chicken", "carrots"],
  "daysCount": 5,
  "mealsPerDay": 3
}
```

#### Request Body Parameters

| Parameter          | Type     | Required | Description                                  |
| ------------------ | -------- | -------- | -------------------------------------------- |
| dietaryPreferences | string[] | No       | Array of dietary restrictions or preferences |
| ingredients        | string[] | No       | Preferred ingredients to include             |
| daysCount          | number   | Yes      | Number of days to generate meals for (1-7)   |
| mealsPerDay        | number   | Yes      | Number of meals per day (1-3)                |

#### Success Response Examples

1. **Single Day Plan**:

```json
{
  "status": "success",
  "data": {
    "mealPlan": [
      {
        "day": 1,
        "meals": [
          {
            "type": "lunch",
            "name": "Quinoa Buddha Bowl",
            "ingredients": [
              "quinoa",
              "chickpeas",
              "sweet potato",
              "avocado",
              "tahini dressing"
            ],
            "nutritionalInfo": {
              "calories": 450,
              "protein": "15g",
              "carbs": "65g",
              "fat": "18g"
            },
            "preparationTime": "25 minutes"
          },
          {
            "type": "dinner",
            "name": "Gluten-Free Vegetable Stir-Fry",
            "ingredients": [
              "rice noodles",
              "tofu",
              "mixed vegetables",
              "tamari sauce"
            ],
            "nutritionalInfo": {
              "calories": 380,
              "protein": "18g",
              "carbs": "55g",
              "fat": "12g"
            },
            "preparationTime": "20 minutes"
          }
        ]
      }
    ]
  }
}
```

2. **Kid-Friendly Plan**:

```json
{
  "status": "success",
  "data": {
    "mealPlan": [
      {
        "day": 1,
        "meals": [
          {
            "type": "breakfast",
            "name": "Banana Pancakes",
            "ingredients": [
              "whole wheat flour",
              "banana",
              "eggs",
              "milk",
              "honey"
            ],
            "nutritionalInfo": {
              "calories": 320,
              "protein": "12g",
              "carbs": "48g",
              "fat": "10g"
            },
            "preparationTime": "15 minutes"
          }
        ]
      }
    ]
  }
}
```

### 2. Generate Bedtime Story

Generate personalized bedtime stories based on themes and age groups.

#### Request Examples

1. **Short Story**:

```http
POST /api/generate-bedtime-story
Content-Type: application/json
Authorization: Bearer your-firebase-id-token

{
  "childName": "Emma",
  "theme": "space adventure",
  "storyLength": "short"
}
```

2. **Educational Story**:

```http
POST /api/generate-bedtime-story
Content-Type: application/json
Authorization: Bearer your-firebase-id-token

{
  "childName": "Alex",
  "theme": "dinosaurs",
  "ageGroup": "8-12",
  "storyLength": "medium",
  "includesMorals": true,
  "educationalFocus": "science"
}
```

#### Success Response Examples

1. **Short Story Response**:

```json
{
  "status": "success",
  "data": {
    "story": {
      "title": "Emma's Magical Space Journey",
      "content": "Emma looked up at the twinkling stars...",
      "metadata": {
        "wordCount": 250,
        "readingTime": "3 minutes",
        "ageGroup": "5-8",
        "theme": "space adventure"
      }
    }
  }
}
```

2. **Educational Story Response**:

```json
{
  "status": "success",
  "data": {
    "story": {
      "title": "Alex's Time-Traveling Dinosaur Adventure",
      "content": "Alex couldn't believe his eyes when he saw the giant Tyrannosaurus Rex...",
      "moral": "Curiosity and learning can lead to amazing discoveries",
      "educationalNotes": {
        "dinosaurFacts": [
          "T-Rex lived during the late Cretaceous period",
          "They could run up to 20 mph"
        ]
      },
      "metadata": {
        "wordCount": 750,
        "readingTime": "8 minutes",
        "ageGroup": "8-12",
        "theme": "dinosaurs",
        "educationalFocus": "paleontology"
      }
    }
  }
}
```

## Testing the API

### Using Postman

1. Import the [Postman Collection](postman/ParentingAssistant.postman_collection.json)
2. Set up environment variables:
   - `base_url`: Your API base URL
   - `firebase_token`: Your Firebase ID token

### Using cURL

1. **Get Firebase Token**:

```bash
# Using Firebase CLI
firebase login:ci
```

2. **Test Meal Plan Generation**:

```bash
curl -X POST https://your-service-url/api/generate-meal-plan \
  -H "Authorization: Bearer your-firebase-token" \
  -H "Content-Type: application/json" \
  -d '{
    "dietaryPreferences": ["vegetarian"],
    "ingredients": ["quinoa"],
    "daysCount": 3,
    "mealsPerDay": 2
  }'
```

### Using JavaScript/TypeScript

```typescript
const generateMealPlan = async () => {
  const token = await firebase.auth().currentUser?.getIdToken();

  const response = await fetch(
    "https://your-service-url/api/generate-meal-plan",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dietaryPreferences: ["vegetarian"],
        daysCount: 3,
        mealsPerDay: 2,
      }),
    }
  );

  const data = await response.json();
  return data;
};
```

## Response Headers

All responses include rate limit headers:

```http
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 49
X-RateLimit-Reset: 1635724800
```

## Error Handling

### Common Error Responses

1. **Invalid Parameters**:

```json
{
  "status": "error",
  "message": "Invalid parameters",
  "details": {
    "daysCount": "Must be between 1 and 7",
    "mealsPerDay": "Must be between 1 and 3"
  }
}
```

2. **Authentication Error**:

```json
{
  "status": "error",
  "message": "Invalid authentication token",
  "code": "AUTH_INVALID_TOKEN"
}
```

3. **Rate Limit Exceeded**:

```json
{
  "status": "error",
  "message": "Rate limit exceeded",
  "retryAfter": 3600
}
```

## Best Practices

1. **Token Management**:

   - Store tokens securely
   - Refresh tokens before expiry
   - Handle token refresh errors

2. **Error Handling**:

   - Implement exponential backoff for rate limits
   - Cache successful responses
   - Handle network errors gracefully

3. **Performance**:
   - Use compression
   - Implement client-side caching
   - Monitor response times

## Rate Limiting Strategy

1. **General API Limits**:

   - 100 requests per 15 minutes per IP
   - Headers indicate remaining quota

2. **AI Endpoint Limits**:

   - 50 requests per hour per user
   - Separate quota for AI operations

3. **Burst Protection**:
   - Maximum 10 requests per minute
   - Automatic cooldown period
