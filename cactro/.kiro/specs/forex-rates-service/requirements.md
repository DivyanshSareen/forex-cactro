# Requirements Document

## Introduction

A forex rates service consisting of a Node.js/Express backend and a minimal React/ShadCN frontend. The service converts currency values between a supported set of currencies, with differentiated behavior for free-tier and paid-tier users. Paid users receive rates from a premium API; free users are served via multiple public APIs with load balancing and fallback. A caching layer reduces redundant API calls, with tier-aware expiry rules. The frontend provides a simple demo UI for selecting a user identity and viewing live exchange rates with freshness indicators.

## Glossary

- **System**: The forex rates service as a whole (backend + frontend).
- **API_Gateway**: The Node.js/Express backend component that handles all HTTP requests.
- **Rate_Fetcher**: The backend component responsible for fetching exchange rates from external APIs.
- **Cache**: The in-memory or persistent caching layer storing exchange rate results.
- **Premium_API**: A paid, reliable third-party currency exchange rate provider. Implemented by Frankfurter_API.
- **Free_API**: A public, no-cost third-party currency exchange rate provider.
- **Free_API_Pool**: The ordered collection of Free_APIs used for load balancing and fallback. Contains Frankfurter_API (primary) and OpenER_API (fallback).
- **Frankfurter_API**: The external currency rate API at `https://api.frankfurter.app`, used as both the Premium_API for paid-tier users and as the primary member of the Free_API_Pool.
- **OpenER_API**: The external currency rate API at `https://open.er-api.com`, used as a Free_API and fallback member of the Free_API_Pool.
- **User_Store**: The Supabase database component that stores user tier information.
- **Background_Updater**: The async component that refreshes cache entries after a response is returned.
- **Frontend**: The React/ShadCN web UI.
- **Exchange_Rate**: The numeric conversion factor between a base currency and a target currency.
- **Cache_Entry**: A stored Exchange_Rate result tagged with a timestamp, source tier, and expiry duration.
- **Freshness_Indicator**: A UI element showing the age or staleness of a displayed Exchange_Rate.
- **Premium_Fallback_Flag**: A boolean field in the API response indicating a Premium_API result was used to serve a free-tier user.
- **Supported_Currencies**: The set {USD, EUR, GBP, JPY, INR}.

---

## Requirements

### Requirement 1: Currency Conversion Endpoint

**User Story:** As a client application, I want a single endpoint that accepts a user ID, base currency, base value, and target currency, so that I can retrieve a converted exchange rate result.

#### Acceptance Criteria

1. THE API_Gateway SHALL expose a single HTTP endpoint accepting `user_id`, `base_currency`, `value_of_base_currency`, and `target_currency` as input fields.
2. WHEN a request is received with all required fields present, THE API_Gateway SHALL return a response containing the converted value, the Exchange_Rate used, the source of the rate (premium or free), and the Premium_Fallback_Flag.
3. IF any required input field is missing or malformed, THEN THE API_Gateway SHALL return an HTTP 422 response with a descriptive validation error message.
4. THE API_Gateway SHALL restrict `base_currency` and `target_currency` to values within Supported_Currencies.
5. IF a currency value outside Supported_Currencies is provided, THEN THE API_Gateway SHALL return an HTTP 400 response indicating the unsupported currency.

---

### Requirement 2: User Tier Resolution

**User Story:** As the system, I want to determine whether a requesting user is on the free or paid tier, so that I can route the rate fetch to the appropriate API.

#### Acceptance Criteria

1. WHEN a request is received, THE API_Gateway SHALL query the User_Store to resolve the tier for the given `user_id`.
2. IF the `user_id` does not exist in the User_Store, THEN THE API_Gateway SHALL treat the user as a free-tier user.
3. THE User_Store SHALL return one of two tier values: `free` or `paid`.
4. THE User_Store SHALL be backed by a Supabase database, with user tier records stored in a Supabase table containing at minimum the `user_id` and `tier` fields.

---

### Requirement 3: Paid-Tier Rate Fetching

**User Story:** As a paid-tier user, I want exchange rates fetched from a reliable premium source, so that I receive accurate and trustworthy data.

#### Acceptance Criteria

1. WHEN the resolved user tier is `paid`, THE Rate_Fetcher SHALL fetch the Exchange_Rate from the Premium_API using the Frankfurter_API endpoint `https://api.frankfurter.app/latest?from={base_currency}`.
2. WHEN the Premium_API returns a successful response, THE API_Gateway SHALL include `"premium": true` in the response payload.
3. IF the Premium_API returns an error or is unreachable, THEN THE Rate_Fetcher SHALL fall back to the Free_API_Pool and THE API_Gateway SHALL set the Premium_Fallback_Flag to `true` in the response.

---

### Requirement 4: Free-Tier Rate Fetching with Fallback

**User Story:** As a free-tier user, I want exchange rates fetched from available public APIs with automatic fallback, so that I receive a result even when individual APIs are unavailable.

#### Acceptance Criteria

1. WHEN the resolved user tier is `free`, THE Rate_Fetcher SHALL attempt to fetch the Exchange_Rate from the Free_API_Pool using a load-balancing strategy.
2. THE Free_API_Pool SHALL contain exactly two members: Frankfurter_API (`https://api.frankfurter.app/latest?from={base_currency}`) as the primary, and OpenER_API (`https://open.er-api.com/v6/latest/{base_currency}`) as the fallback.
3. IF the selected Free_API returns an error or is unreachable, THEN THE Rate_Fetcher SHALL attempt the next available Free_API in the Free_API_Pool.
4. IF all Free_APIs in the Free_API_Pool are unavailable, THEN THE API_Gateway SHALL return an HTTP 503 response with a descriptive error message.
5. THE Rate_Fetcher SHALL support a minimum of two Free_APIs in the Free_API_Pool.

---

### Requirement 5: Caching Layer

**User Story:** As the system, I want to cache exchange rate results, so that repeated requests for the same currency pair do not trigger redundant external API calls.

#### Acceptance Criteria

1. THE Cache SHALL store Cache_Entries keyed by `(base_currency, target_currency)`.
2. WHEN a Cache_Entry exists and has not expired, THE Rate_Fetcher SHALL return the cached Exchange_Rate without calling an external API.
3. THE Cache SHALL apply an expiry of 5 minutes to Cache_Entries populated from the Premium_API.
4. THE Cache SHALL apply an expiry of less than 5 minutes to Cache_Entries populated from the Free_API_Pool.
5. WHEN a Premium_API result is stored for a `(base_currency, target_currency)` key that already has a free-tier Cache_Entry, THE Cache SHALL overwrite the free-tier Cache_Entry with the premium result and apply the premium expiry.
6. WHEN a Cache_Entry is returned to the caller, THE API_Gateway SHALL include the cache timestamp in the response so the Frontend can compute data freshness.

---

### Requirement 6: Async Background Cache Update

**User Story:** As a user, I want to receive a rate response immediately, so that I am not blocked waiting for a background cache refresh.

#### Acceptance Criteria

1. WHEN a valid Exchange_Rate is returned to the caller, THE Background_Updater SHALL asynchronously refresh the Cache_Entry for that currency pair without blocking the HTTP response.
2. THE API_Gateway SHALL return the response to the caller before the Background_Updater completes its refresh.
3. IF the Background_Updater encounters an error during refresh, THE System SHALL log the error and leave the existing Cache_Entry unchanged.

---

### Requirement 7: Graceful Failure Handling

**User Story:** As an operator, I want the service to remain operational when individual external APIs are down, so that users are not affected by third-party outages.

#### Acceptance Criteria

1. IF an external API call raises a network exception or returns a non-2xx HTTP status, THEN THE Rate_Fetcher SHALL catch the error, log it, and proceed to the next available source without propagating an unhandled exception.
2. WHILE at least one Free_API in the Free_API_Pool is reachable, THE System SHALL continue serving free-tier requests.
3. THE System SHALL not terminate or restart due to an external API failure.

---

### Requirement 8: Exchange Rate Parsing and Serialization

**User Story:** As the system, I want to reliably parse and serialize exchange rate data from external APIs, so that data integrity is maintained across all tiers.

#### Acceptance Criteria

1. WHEN a response is received from an external API, THE Rate_Fetcher SHALL parse the response into a structured Exchange_Rate object containing the rate value, currency pair, and retrieval timestamp.
2. IF the external API response does not conform to the expected schema, THEN THE Rate_Fetcher SHALL treat the response as a failure and proceed to the next available source.
3. THE API_Gateway SHALL serialize Exchange_Rate objects into a consistent JSON response format for all callers.
4. FOR ALL valid Exchange_Rate objects, parsing then serializing then parsing SHALL produce an equivalent Exchange_Rate object (round-trip property).

---

### Requirement 9: Frontend — User Selection and Rate Display

**User Story:** As a demo user, I want a minimal UI to select a user identity and view current exchange rates, so that I can observe the difference in behavior between free and paid tiers.

#### Acceptance Criteria

1. THE Frontend SHALL present a selector allowing the user to choose between a hardcoded free-tier user ID and a hardcoded paid-tier user ID.
2. THE Frontend SHALL display Exchange_Rates for all pairs within Supported_Currencies for the selected user.
3. WHEN an Exchange_Rate is displayed, THE Frontend SHALL render a Freshness_Indicator showing the age of the rate data in seconds or minutes.
4. WHEN the API response includes `"premium": true`, THE Frontend SHALL visually distinguish the rate entry from free-tier entries without decorative animations.
5. WHEN the API response includes `Premium_Fallback_Flag` set to `true`, THE Frontend SHALL display a label indicating the rate was sourced from the premium API as a fallback.
6. IF the API_Gateway returns an error response, THEN THE Frontend SHALL display a non-blocking inline error message without crashing or navigating away.

---

### Requirement 10: Data Freshness Indicator

**User Story:** As a user, I want to see how fresh the displayed exchange rate data is, so that I can judge its reliability.

#### Acceptance Criteria

1. THE Frontend SHALL compute the age of each displayed Exchange_Rate using the cache timestamp included in the API response.
2. WHEN the age of a Cache_Entry exceeds the applicable cache expiry duration, THE Frontend SHALL render the Freshness_Indicator in a visually distinct state to signal staleness.
3. THE Freshness_Indicator SHALL update at an interval of 30 seconds or less without requiring a full page reload.
