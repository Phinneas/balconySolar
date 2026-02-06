# Feature Spec: Find Solar Companies Near You

## Project Context

This is a React 18 + Vite frontend with a Cloudflare Workers REST API backend. The app helps users check if balcony solar is legal in their U.S. state. The existing flow: user selects a state from a dropdown → app fetches state data from the API → displays legal status, regulations, and resources.

### Tech Stack
- **Frontend:** React 18, Vite 5, plain CSS (no Tailwind/Bootstrap), PropTypes for type checking
- **Backend:** Cloudflare Workers (ES modules), manual route matching (no framework)
- **Database:** Teable (Airtable-like hosted DB)
- **Caching:** Custom in-memory CacheManager class (`api/src/cache.js`)
- **Deployment:** Cloudflare Workers (API) + Cloudflare Pages (frontend)

### Key Existing Files
- `frontend/src/App.jsx` — Main app component, manages state selection, fetches from API, renders results
- `frontend/src/components/StateResults.jsx` — Displays state info, details accordion, resources
- `frontend/src/components/DetailAccordion.jsx` — Expandable accordion component (pattern reference)
- `frontend/src/components/StateSelector.jsx` — State dropdown selector
- `frontend/src/styles/StateResults.css` — Reference for design tokens and responsive patterns
- `api/src/index.js` — All API routes (GET /api/states, GET /api/states/:code, POST /api/feedback, etc.)
- `api/src/cache.js` — CacheManager class with TTL-based in-memory caching
- `api/src/errors.js` — Custom error classes (APIError, BadRequestError, NotFoundError, ExternalServiceError, TimeoutError)
- `frontend/.env.production` — Contains `VITE_API_URL` pointing to the deployed API worker

---

## Feature Requirements

Add a "Find Solar Companies Near You" section that appears inside the state results after a user selects their state. The user enters a zip code and sees a list of nearby solar installation companies fetched from the Google Places API.

### User Flow
1. User selects a state → state results render (existing behavior)
2. Below the existing resources section, a new "Find Solar Companies Near You" section appears
3. User enters a 5-digit zip code and clicks "Search"
4. App calls backend proxy → backend calls Google Places API → returns company list
5. Company cards display with: name, star rating + review count, address, phone (clickable), website (external link), "View on Google Maps" link
6. Results are cached for 7 days to reduce API costs

### Constraints
- Google Places API key must NEVER be exposed to the frontend — all calls go through the backend proxy
- Daily request limit of 100 uncached searches to control costs
- No new frontend dependencies — use React + fetch only
- Match existing CSS patterns (colors, spacing, responsive breakpoints)
- Accessible: aria-labels, keyboard navigation, numeric input mode

---

## Implementation Instructions

### 1. Add RateLimitError class

**File to modify:** `api/src/errors.js`

Add a new error class following the existing pattern:

```javascript
export class RateLimitError extends APIError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}
```

---

### 2. Add Google Places proxy route to the API

**File to modify:** `api/src/index.js`

**At the top of the file**, after existing imports and constants:

- Import `RateLimitError` from `./errors.js`
- Create a second `CacheManager` instance with 7-day TTL: `const solarCompanyCache = new CacheManager(7 * 24 * 60 * 60 * 1000)`
- Add daily rate limit tracking: `let dailyRequestCount = 0` and `let dailyResetTimestamp = Date.now()`
- Define `const DAILY_REQUEST_LIMIT = 100`
- Read the Google Places API key from the environment/secrets (the worker receives `env` as the second argument to the fetch handler)

**Add a new route** `GET /api/solar-companies` before the 404 catch-all. The route handler should:

1. Extract `zip` and `state` query parameters from the URL
2. Validate that `zip` is a 5-digit number — return 400 if invalid
3. Check cache with key `solar-companies-${zip}` — return cached result if found (set `X-Cache: HIT` header)
4. Check daily rate limit — reset counter if 24 hours have passed, return 429 if limit exceeded
5. Increment daily counter and call Google Places Text Search API:
   - URL: `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent('solar panel installation companies near ' + zip)}&key=${apiKey}`
   - Use AbortController with 8-second timeout
6. Handle Google Places response statuses: `ZERO_RESULTS` (return empty array), `OK` (process results), anything else (throw ExternalServiceError)
7. Map the top 10 results to this shape:
   ```javascript
   {
     name: place.name,
     address: place.formatted_address,
     rating: place.rating || null,
     reviewCount: place.user_ratings_total || 0,
     businessStatus: place.business_status || 'UNKNOWN',
     placeId: place.place_id,
     phone: null,
     website: null
   }
   ```
8. For the top 5 results, fetch Place Details in parallel to get phone and website:
   - URL: `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_phone_number,website&key=${apiKey}`
   - Silently ignore individual detail failures
9. Cache the final result for 7 days
10. Return JSON response:
    ```json
    {
      "companies": [...],
      "resultCount": 5,
      "searchedZip": "90210"
    }
    ```

**CORS:** Apply the same `corsHeaders` used by all other routes. Also add the `/api/solar-companies` path to the OPTIONS preflight handler.

**Error responses to implement:**
- 400: `{ "error": { "message": "Valid 5-digit zip code required", "code": "BAD_REQUEST" } }`
- 429: `{ "error": { "message": "Daily search limit reached. Please try again tomorrow.", "code": "RATE_LIMIT_EXCEEDED" } }`
- 502: `{ "error": { "message": "Unable to search right now. Please try again later.", "code": "EXTERNAL_SERVICE_ERROR" } }`

---

### 3. Configure API key

**File to modify:** `api/wrangler.toml`

Add a placeholder for the Google Places API key. The actual key should be set via `wrangler secret put GOOGLE_PLACES_API_KEY`.

Ensure the worker's fetch handler accepts the `env` parameter so it can access `env.GOOGLE_PLACES_API_KEY`. If the current code doesn't pass `env` through to the handler, update the export/handler signature to include it.

---

### 4. Create SolarCompanyFinder component

**File to create:** `frontend/src/components/SolarCompanyFinder.jsx`

**Props:**
- `stateCode` (string, required) — e.g., "ca"
- `stateName` (string, required) — e.g., "California"
- `apiUrl` (string, required) — base API URL from environment

**Internal state:**
- `zipCode` (string) — user input, default ""
- `companies` (array) — search results, default []
- `loading` (boolean) — default false
- `error` (string|null) — default null
- `hasSearched` (boolean) — default false

**Behavior:**
- `useEffect` on `stateCode` — reset all internal state when user changes state
- Input field: `type="text"`, `inputMode="numeric"`, `maxLength={5}`, filters non-digits on change (`e.target.value.replace(/\D/g, '').slice(0, 5)`)
- Search button: disabled when `loading` or `zipCode.length !== 5`
- On form submit:
  1. Validate zip matches `/^\d{5}$/` — set error if invalid
  2. Set loading=true, error=null, hasSearched=true
  3. Fetch `${apiUrl}/api/solar-companies?zip=${zipCode}&state=${stateCode}` with 10-second AbortController timeout
  4. On success: set companies from response
  5. On error: set error message from response body or generic message
  6. Set loading=false in finally block

**Render sections:**
1. **Header:** `<h3>Find Solar Companies Near You</h3>` with subtitle mentioning `stateName`
2. **Search form:** zip input + search button in a flex row
3. **Error message:** red alert box (only when `error` is set)
4. **Loading indicator:** "Searching for solar companies..." text (only when `loading`)
5. **Empty state:** "No solar companies found near {zipCode}. Try a nearby zip code." (only when `hasSearched && !loading && !error && companies.length === 0`)
6. **Results grid:** company cards in a responsive CSS grid

**Company card content:**
- Company name as `<h4>`
- Star rating: render filled stars (★) and empty stars (☆) based on `rating`, with `aria-label` for accessibility. Show rating number and review count text.
- Address as paragraph
- Phone as `<a href="tel:...">` link (only if phone exists)
- Two action links at bottom: "Visit Website" (if website exists) and "View on Google Maps" (using `https://www.google.com/maps/place/?q=place_id:${placeId}`)

Use PropTypes for all props validation. Export as default.

---

### 5. Create component styles

**File to create:** `frontend/src/styles/SolarCompanyFinder.css`

**Design tokens (match existing codebase):**
- Primary gradient: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)` — use for search button
- Border color: `#e5e7eb`
- Border radius: `6px` for cards, `8px` for input
- Text colors: `#1f2937` (headings), `#4b5563` (body), `#6b7280` (secondary)
- Link color: `#3b82f6`
- Star color: `#f59e0b` (filled), `#d1d5db` (empty)
- Error background: `#fef2f2`, error text: `#c33`
- Card background: `white`

**Layout:**
- `.solar-finder` — section container with `margin-top: 32px`, `border-top: 1px solid #e5e7eb`, `padding-top: 24px`
- `.solar-finder__form` — form wrapper
- `.solar-finder__input-group` — flex row with gap, input takes `flex: 1`
- `.solar-finder__input` — styled text input, `padding: 10px 14px`, matching existing input styles
- `.solar-finder__button` — gradient background, white text, `padding: 10px 24px`, `min-height: 44px`, hover darkening effect, disabled opacity 0.6
- `.solar-finder__grid` — `display: grid`, `grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))`, `gap: 16px`
- `.solar-finder__card` — white background, border, border-radius, padding 16px, hover effect with slight shadow and border color change
- `.solar-finder__card-name` — bold, `font-size: 16px`
- `.solar-finder__card-rating` — flex row with stars + text
- `.solar-finder__card-actions` — flex row with gap for action links, styled as small pill-shaped links

**Responsive:**
- At 768px: grid goes single column, input group stacks vertically
- At 480px: smaller padding, font sizes adjust
- Print: hide `.solar-finder__form`, show company info only

---

### 6. Integrate component into App.jsx

**File to modify:** `frontend/src/App.jsx`

- Add import at top: `import SolarCompanyFinder from './components/SolarCompanyFinder'`
- Inside the `{selectedState && (...)}` JSX block, after the resources section and before the share/related content section, add:
  ```jsx
  <SolarCompanyFinder
    stateCode={selectedState.code}
    stateName={selectedState.name}
    apiUrl={apiUrl}
  />
  ```

This is the only change to App.jsx. The component is fully self-contained.

---

### 7. Write tests

**File to create:** `frontend/src/components/SolarCompanyFinder.test.jsx`

Use vitest + React Testing Library (already configured in the project). Mock `global.fetch` with `vi.fn()`.

**Test cases:**
1. Renders search input and button
2. Button is disabled when zip code is less than 5 digits
3. Shows error for invalid zip code input
4. Calls correct API endpoint on valid search
5. Displays loading state during fetch
6. Renders company cards with name, rating, address
7. Shows empty state message when no results
8. Handles API error responses gracefully
9. Resets state when stateCode prop changes
10. Phone number renders as clickable tel: link
11. Website renders as external link with noopener

**File to create:** `api/__tests__/solar-companies.test.js`

Mock the global `fetch` to simulate Google Places API responses.

**Test cases:**
1. Returns 400 for missing zip parameter
2. Returns 400 for invalid zip format
3. Returns companies array for valid zip
4. Returns cached result on second identical request
5. Returns 429 when daily limit is exceeded
6. Returns 502 when Google API fails
7. Response includes CORS headers

---

## Verification Checklist

After implementation, verify:

- [ ] `wrangler dev` in `api/` — hit `GET /api/solar-companies?zip=90210` and confirm JSON response with companies
- [ ] Hit same endpoint again — confirm `X-Cache: HIT` header
- [ ] `npm run dev` in `frontend/` — select a state, enter zip, confirm company cards render
- [ ] Enter invalid zip (e.g., "abc") — confirm inline validation error
- [ ] Resize browser below 768px — confirm cards stack to single column
- [ ] Run `npx vitest` in `frontend/` — all tests pass
- [ ] Run tests in `api/` — all tests pass
- [ ] Check that Google API key is NOT present in any frontend code or browser network requests
