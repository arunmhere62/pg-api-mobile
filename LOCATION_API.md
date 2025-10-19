# Location API Documentation

## Overview
APIs for fetching countries, states, and cities data from the database.

---

## Endpoints

### 1. Get All Countries
Get a list of all countries.

**Endpoint:** `GET /api/v1/location/countries`

**Response:**
```json
{
  "success": true,
  "message": "Countries fetched successfully",
  "data": [
    {
      "s_no": 1,
      "name": "India",
      "iso_code": "IN",
      "flag": "🇮🇳",
      "phone_code": "+91",
      "currency": "INR",
      "latitude": "20.5937000",
      "longitude": "78.9629000"
    }
  ]
}
```

**Example:**
```bash
curl -X GET http://localhost:3000/api/v1/location/countries
```

---

### 2. Get Country by ISO Code
Get a specific country by its ISO code.

**Endpoint:** `GET /api/v1/location/countries/:isoCode`

**Parameters:**
- `isoCode` (path) - Country ISO code (e.g., IN, US)

**Response:**
```json
{
  "success": true,
  "message": "Country fetched successfully",
  "data": {
    "s_no": 1,
    "name": "India",
    "iso_code": "IN",
    "flag": "🇮🇳",
    "phone_code": "+91",
    "currency": "INR",
    "latitude": "20.5937000",
    "longitude": "78.9629000"
  }
}
```

**Example:**
```bash
curl -X GET http://localhost:3000/api/v1/location/countries/IN
```

---

### 3. Get States by Country Code
Get all states for a specific country.

**Endpoint:** `GET /api/v1/location/states?countryCode={code}`

**Query Parameters:**
- `countryCode` (required) - Country ISO code (e.g., IN)

**Response:**
```json
{
  "success": true,
  "message": "States fetched successfully",
  "data": [
    {
      "s_no": 1,
      "name": "Karnataka",
      "iso_code": "KA",
      "country_code": "IN",
      "latitude": "15.3173000",
      "longitude": "75.7139000"
    },
    {
      "s_no": 2,
      "name": "Maharashtra",
      "iso_code": "MH",
      "country_code": "IN",
      "latitude": "19.7515000",
      "longitude": "75.7139000"
    }
  ]
}
```

**Example:**
```bash
curl -X GET "http://localhost:3000/api/v1/location/states?countryCode=IN"
```

**Error Response (Missing countryCode):**
```json
{
  "statusCode": 400,
  "message": "countryCode is required",
  "error": "Bad Request"
}
```

---

### 4. Get State by ID
Get a specific state by its ID.

**Endpoint:** `GET /api/v1/location/states/:id`

**Parameters:**
- `id` (path) - State ID (numeric)

**Response:**
```json
{
  "success": true,
  "message": "State fetched successfully",
  "data": {
    "s_no": 1,
    "name": "Karnataka",
    "iso_code": "KA",
    "country_code": "IN",
    "latitude": "15.3173000",
    "longitude": "75.7139000",
    "country": {
      "name": "India",
      "iso_code": "IN"
    }
  }
}
```

**Example:**
```bash
curl -X GET http://localhost:3000/api/v1/location/states/1
```

---

### 5. Get Cities by State Code
Get all cities for a specific state.

**Endpoint:** `GET /api/v1/location/cities?stateCode={code}`

**Query Parameters:**
- `stateCode` (required) - State ISO code (e.g., KA)

**Response:**
```json
{
  "success": true,
  "message": "Cities fetched successfully",
  "data": [
    {
      "s_no": 1,
      "name": "Bangalore",
      "country_code": "IN",
      "state_code": "KA",
      "latitude": "12.9716000",
      "longitude": "77.5946000"
    },
    {
      "s_no": 2,
      "name": "Mysore",
      "country_code": "IN",
      "state_code": "KA",
      "latitude": "12.2958000",
      "longitude": "76.6394000"
    }
  ]
}
```

**Example:**
```bash
curl -X GET "http://localhost:3000/api/v1/location/cities?stateCode=KA"
```

**Error Response (Missing stateCode):**
```json
{
  "statusCode": 400,
  "message": "stateCode is required",
  "error": "Bad Request"
}
```

---

### 6. Get City by ID
Get a specific city by its ID.

**Endpoint:** `GET /api/v1/location/cities/:id`

**Parameters:**
- `id` (path) - City ID (numeric)

**Response:**
```json
{
  "success": true,
  "message": "City fetched successfully",
  "data": {
    "s_no": 1,
    "name": "Bangalore",
    "country_code": "IN",
    "state_code": "KA",
    "latitude": "12.9716000",
    "longitude": "77.5946000"
  }
}
```

**Example:**
```bash
curl -X GET http://localhost:3000/api/v1/location/cities/1
```

---

## Usage Examples

### JavaScript (Fetch)

```javascript
// Get all countries
const countries = await fetch('http://localhost:3000/api/v1/location/countries')
  .then(res => res.json());

// Get states by country
const states = await fetch('http://localhost:3000/api/v1/location/states?countryCode=IN')
  .then(res => res.json());

// Get cities by state
const cities = await fetch('http://localhost:3000/api/v1/location/cities?stateCode=KA')
  .then(res => res.json());
```

### Axios

```javascript
import axios from 'axios';

// Get all countries
const { data: countries } = await axios.get('/api/v1/location/countries');

// Get states by country
const { data: states } = await axios.get('/api/v1/location/states', {
  params: { countryCode: 'IN' }
});

// Get cities by state
const { data: cities } = await axios.get('/api/v1/location/cities', {
  params: { stateCode: 'KA' }
});
```

### React Native Example

```typescript
import { API_BASE_URL } from '@/config';

// Fetch states for signup form
const fetchStates = async (countryCode: string) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/location/states?countryCode=${countryCode}`
    );
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    }
  } catch (error) {
    console.error('Error fetching states:', error);
  }
};

// Fetch cities for signup form
const fetchCities = async (stateCode: string) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/location/cities?stateCode=${stateCode}`
    );
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    }
  } catch (error) {
    console.error('Error fetching cities:', error);
  }
};
```

---

## Common Use Cases

### 1. Signup Form - Cascading Dropdowns

```typescript
// Step 1: Load countries on component mount
const countries = await fetchCountries();

// Step 2: When user selects a country, load states
const onCountryChange = async (countryCode: string) => {
  const states = await fetchStates(countryCode);
  setStates(states);
};

// Step 3: When user selects a state, load cities
const onStateChange = async (stateCode: string) => {
  const cities = await fetchCities(stateCode);
  setCities(cities);
};
```

### 2. Display Location Information

```typescript
// Get full location details
const stateInfo = await fetchStateById(stateId);
const cityInfo = await fetchCityById(cityId);

console.log(`${cityInfo.data.name}, ${stateInfo.data.name}, ${stateInfo.data.country.name}`);
// Output: Bangalore, Karnataka, India
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "statusCode": 400,
  "message": "Error message here",
  "error": "Bad Request"
}
```

Common error codes:
- `400` - Bad Request (missing parameters, invalid data)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Notes

1. **Data Ordering**: All lists are sorted alphabetically by name
2. **Coordinates**: Latitude and longitude are provided as Decimal values
3. **ISO Codes**: Use standard ISO codes for countries and states
4. **Swagger Documentation**: Available at `/api/docs`

---

## Integration with Signup API

When using the signup API, you need to provide `stateId` and `cityId`:

```javascript
// 1. User selects country (e.g., India - IN)
const states = await fetchStates('IN');

// 2. User selects state (e.g., Karnataka - KA)
const cities = await fetchCities('KA');

// 3. User selects city (e.g., Bangalore)
const selectedCity = cities.find(c => c.name === 'Bangalore');

// 4. Use the IDs in signup
const signupData = {
  // ... other fields
  stateId: selectedState.s_no,  // Use s_no as ID
  cityId: selectedCity.s_no,     // Use s_no as ID
};
```
