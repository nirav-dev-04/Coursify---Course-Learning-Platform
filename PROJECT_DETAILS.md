# EduFlow: Technical Specifications & System Implementation Manual

EduFlow is an optimized, high-fidelity **Udemy Clone Course Selling Platform** engineered with a premium React/Next.js frontend and a secure, high-performance Spring Boot backend. This document serves as the complete technical manual mapping out the entire system architecture, database configurations, frontend features, security policies, and custom system design solutions implemented in the codebase.

---

## 1. Core Technology Stack

| Layer | Technologies & Libraries | Key Responsibility |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 14 (App Router), React 18, TypeScript | Server-Side Rendering (SSR), Static Generation (SSG), and type-safe component logic. |
| **Frontend Styling** | Tailwind CSS, Lucide Icons, Framer Motion | Modern, responsive grid systems, consistent design tokens, and fluid micro-animations. |
| **Frontend State** | Zustand, React Query (TanStack Query v5) | **Zustand** manages client-side memory stores (auth session, cart). **React Query** manages server state, caching, background refetches, and optimistic updates. |
| **Video Playback** | HLS.js Library | Facilitates HTTP Live Streaming (HLS) with adaptive bitrate rendering on native HTML `<video>` elements. |
| **Backend API Engine** | Spring Boot 3, Java 17, Maven | REST controller routing, business exception handling, async jobs, and scheduled Cron tasks. |
| **Backend Security** | Spring Security 6, JWT, HTTPOnly Cookies | Stateless session filters, Google OAuth token verification, role-based authorization, and refresh token cookie handling. |
| **Database Layer** | PostgreSQL 16, Spring Data JPA, Flyway | Persistent relational storage, schema integrity constraints, full-text indexes, and automated database migrations. |
| **Caching Layer** | Redis Stack | High-write buffer cache for student progress ticks and session key storage. |
| **Media & Storage** | AWS S3, AWS CloudFront CDN | Video content storage, private media access using RSA-signed cookies, and FFMPEG transcoding. |
| **Integrations** | Razorpay Gateway, Google Identity Service | Idempotent checkout orders, payment webhooks, and single-tap OAuth auth. |

---

## 2. Comprehensive User Interaction Flows (Button-to-Database Trace)

This section maps out the exact technical pathways executed across frontend components, state stores, REST APIs, cache servers, and database transactions when users trigger key actions on the platform.

### Flow A: The Shopping Cart Addition Flow
```
[Client UI Button] ──> [useCartStore (Zustand)] ──> [Axios POST Request] ──> [CartController] ──> [CartService] ──> [PostgreSQL Table]
```

1. **User Interaction:** The student clicks the "Add to Cart" button on the course listings page.
2. **Client State Update (Optimistic Update):** 
   - `useCartStore.addToCart(courseId, courseData)` is called.
   - The store saves the previous items state, immediately appends a temporary item with a mockup ID into memory to update the UI instantly (avoiding loading lags), and sets the status to loading.
   ```typescript
   // Store logic snippet from useCartStore.ts
   addToCart: async (courseId: number, courseData: any) => {
     const previousItems = get().items;
     const tempItem: CartItem = {
       id: Date.now(), // Temp unique ID
       user: {} as any,
       course: courseData,
       addedAt: new Date().toISOString()
     };
     set({ items: [...previousItems, tempItem] });
     ...
   ```
3. **HTTP API Request:** 
   - The store makes an asynchronous Axios POST call to `/api/cart?courseId=${courseId}`.
   - The frontend `api.interceptors.request` automatically reads the client access token from JavaScript runtime memory and appends it to the headers: `Authorization: Bearer <token>`.
4. **Backend Security Filter:** Spring Security's `JwtAuthenticationFilter` interceptor validates the JWT, extracts user details, and populates the `SecurityContextHolder`.
5. **Backend Processing:** 
   - `CartController` routes the request to `CartService.addCourseToCart(courseId, userId)`.
   - The service fetches the authenticated user object and course object, instantiates a new `CartItem` entity, and calls `cartRepository.save(cartItem)`.
6. **Database Write:** 
   - Inserts a row into the `cart_items` table.
   - Enforces the database unique constraint: `UNIQUE(user_id, course_id)`. If the student attempts to add the same course concurrently in another browser tab, the transaction fails on unique violation, returning a `409 Conflict` state.
7. **Client State Synchronization:**
   - On response success, the store replaces the temporary mock item with the verified backend entity return.
   - On response failure, the store catches the exception and automatically rolls back the items list to the cached `previousItems` list to preserve synchronization.

---

### Flow B: Razorpay Checkout, Verification, & Webhook Enrollment (Payment Flow)
```
[Pay Button] ──> [/api/orders/checkout] ──> [Razorpay API (paise)] ──> [Payment Popup] 
   └── Verification: [/api/orders/verify] (HMAC-SHA256) ──> [Pessimistic Lock] ──> [Enrollment DB Write]
   └── Fallback Webhook: [Razorpay POST] ──> [/api/orders/webhook] (HMAC-SHA256) ──> [Enrollment DB Write]
```

1. **User Interaction:** The student clicks "Enroll Now" or "Pay Now" on the checkout summary card.
2. **Order Checkout API Call:**
   - The frontend generates a unique UUID `idempotencyKey` and posts it to `/api/orders/checkout` along with payment details.
3. **Backend Checkout Management (Order Creation):**
   - `OrderService.createCheckoutOrder` checks if an order with the same `idempotencyKey` exists:
     - **If yes (Idempotent Hit):** Instantly returns the existing order details, preventing duplicate transaction triggers on Razorpay.
     - **If no (New Hit):** Fetch the cart items from the database, sum the prices, and persist a local `Order` object in `PENDING` state with a comma-separated snapshot of course IDs.
   ```java
   // Local Order creation snippet from OrderService.java
   Order order = Order.builder()
           .user(user)
           .idempotencyKey(key)
           .totalAmount(total)
           .courseIds(courseIdsStr)
           .status("PENDING")
           .paymentMethod(request.getPaymentMethod().toUpperCase())
           ...
           .build();
   order = orderRepository.save(order);
   ```
4. **Razorpay Remote Register:**
   - The backend calls the `RazorpayClient` SDK to generate an order with Razorpay:
   ```java
   JSONObject orderRequest = new JSONObject();
   orderRequest.put("amount", total.multiply(BigDecimal.valueOf(100)).longValue()); // Converts INR Rupees to Paise
   orderRequest.put("currency", "INR");
   orderRequest.put("receipt", "order_rcpt_" + order.getId());
   com.razorpay.Order razorpayOrder = razorpayClient.orders.create(orderRequest);
   ```
   - Retransmits the returned `razorpayOrderId` and public `razorpayKeyId` back to the frontend.
5. **Razorpay Secure Checkout Modal:**
   - The frontend opens the official Razorpay Checkout SDK dialog. The student fills in credentials and completes authentication.
6. **Verification handshakes (Dual-Path Processing):**
   - **Path 1: Standard Redirect Callback (Verify Client Redirect):**
     - Razorpay returns `razorpay_payment_id`, `razorpay_order_id`, and `razorpay_signature` to the browser.
     - The frontend POSTs these parameters to `/api/orders/verify`.
     - `OrderService` calculates `HMAC-SHA256` of `razorpay_order_id + "|" + razorpay_payment_id` using the private webhook secret key.
     - If it matches `razorpay_signature`, the payment is verified.
   - **Path 2: Asynchronous Event Callback (Webhook Source of Truth):**
     - If the student closes their browser window instantly after payment, the redirect verification fails.
     - Razorpay fires a secure webhook notification payload directly to the public `/api/orders/webhook` callback endpoint.
     - The backend computes verification of the signature header using HMAC-SHA256. If valid, it extracts the `razorpay_order_id` and processes completion.
7. **Concurrency Lock & Enrollment Finalization:**
   - Both Path 1 and Path 2 trigger `processSuccessfulOrder(order)`. To prevent race conditions where both handles update progress concurrently, the backend reads and locks the order row using **Pessimistic Write Locking** (`SELECT ... FOR UPDATE`):
   ```java
   // Pessimistic Lock enforcement in OrderRepository.java
   @Lock(LockModeType.PESSIMISTIC_WRITE)
   @Query("SELECT o FROM Order o WHERE o.razorpayOrderId = :razorpayOrderId")
   Optional<Order> findByRazorpayOrderIdWithLock(String razorpayOrderId);
   ```
   - Checks if status is already `SUCCESS`. If yes, returns instantly (skipping duplicate updates).
   - If `PENDING`, updates state to `SUCCESS`, persists `Enrollment` rows for all purchased course IDs, clears the student's shopping cart, and completes the transaction.

---

### Flow C: Real-Time Full-Text Search Suggestions
```
[Keyboard Keydown] ──> [Query Length Check] ──> [GET /api/courses] ──> [tsvector Search GIN Index] ──> [Dropdown Render]
```

1. **User Interaction:** The student types keywords (e.g., "t", "tra", "trading") in the Navbar search input.
2. **Input Length Filter:** The search handler triggers fetch requests from the first character (length >= 1), enabling dynamic Google-style auto-completion.
3. **Database Native Execution:**
   - Next.js proxies the call to `GET /api/courses?search=<query>`.
   - The backend runs a PostgreSQL GIN index scan. The query parses input parameters via `plainto_tsquery` and scans the pre-calculated `search_vector` vector columns.
   - **Fallback Substring Match:** If the fuzzy FTS parser does not match keywords due to partial tokens (e.g., single characters like "t"), the repository executes a secondary `LIKE %t%` query over course titles, categories, and author fields to return related values.
4. **Dropdown Suggestions Display:**
   - The search results return JSON catalogs.
   - The frontend maps and displays matching course suggestions in an absolute dropdown overlay beneath the input bar.
5. **Suggestion Selection & Input Reset:**
   - When the student clicks a suggestion card, the router redirects them to `/courses/[slug]`.
   - The event handler triggers `setSearchTerm('')`, immediately clearing the search query input and closing the suggestions box.

---

### Flow D: HLS Video Progress Heartbeat & scheduled Database write-back
```
[Video Timeupdate] ──> [10s Heartbeat Timer] ──> [PUT /api/progress] ──> [Write Redis Hash] 
  └── [Redis Dirty Set Store] ──> [5min Spring Cron Job] ──> [Database Batch Write-Back]
```

1. **User Interaction:** The student clicks the play button on a lecture video in `/learn/[courseId]`.
2. **HLS Stream Segmentation:** `hls.js` initializes, requests the secure CloudFront `.m3u8` index file, and starts downloading `.ts` segment video chunks. CloudFront Signed Cookies on the browser authorize each chunk fetch.
3. **Client Progress Heartbeat:**
   - The custom HTML5 `<video>` player listens to the `timeupdate` event.
   - Every 10 seconds of active playback, it dispatches an asynchronous `PUT` call to `/api/progress/{courseId}/{lectureId}?percent={calculatedPercent}`.
4. **Fast Cache Persistence (Write-Back Policy):**
   - The Spring REST handler routes the request to `ProgressTracker.java`.
   - Instead of writing directly to PostgreSQL (which creates intensive SQL update locks), it stores progress in a high-speed Redis Hash and flags the record as "dirty":
   ```java
   // In-memory caching logic inside ProgressTracker.java
   String progressKey = "user:progress:" + userId + ":" + courseId;
   String dirtyValue = userId + ":" + courseId;
   
   // Write watch percentage to Redis course progress hash
   redisTemplate.opsForHash().put(progressKey, String.valueOf(lectureId), String.valueOf(percent));
   // Push dirty identifier reference to Redis Set
   redisTemplate.opsForSet().add("user:progress:dirty", dirtyValue);
   ```
5. **Scheduled Database Sync (Spring Cron):**
   - Every 5 minutes, `ProgressFlushScheduler.flushProgressToDB()` triggers:
   ```java
   @Scheduled(fixedDelay = 300000)
   @Transactional
   public void flushProgressToDB() { ... }
   ```
   - Pulls all dirty keys from the `user:progress:dirty` Set using `redisTemplate.opsForSet().members(...)`.
   - For each dirty course record, pops the key thread-safely via `remove()`, queries the progress details mapping from the Redis Hash, translates the values to entity arrays, and runs a bulk SQL save (`progressRepository.saveAll(progressBatch)`).
   - If Redis goes offline, the tracking handler catches the cache connection exception and falls back to a direct PostgreSQL transaction to ensure student watch progress is never lost.

---

### Flow E: Profile Settings Update & Real-Time Header Sync
```
[Save Button] ──> [PUT /api/user/profile] ──> [Zustand useAuth State Write] ──> [Instant Header Render]
```

1. **User Interaction:** The student updates their name or selects a new avatar template in `/user/settings` and clicks "Save Changes".
2. **API Update Request:** The browser sends a `PUT` request to `/api/user/profile` containing the updated parameters.
3. **Database Write:** The backend updates the record in the `users` table and returns the updated user profile JSON object.
4. **Zustand Store Synchronization:**
   - The frontend settings callback catches the success response.
   - Instead of waiting for a page reload or firing a full browser refresh, it updates the `useAuth` Zustand store:
   ```typescript
   // Store update in settings/page.tsx
   const response = await api.put('/user/profile', profileData);
   useAuth.setState({ user: response.data });
   ```
5. **Real-time Navigation Sync:** The global `Navbar.tsx` component is subscribed to the `useAuth` state. The instant Zustand writes changes, the profile icon (displaying the selected avatar template or initials) changes immediately without layout glitches or latency.

---

## 3. Database Schema & Constraints Matrix

Flyway SQL schema migrations ensure persistent relational structures with index tables:

| Table Name | Primary Key | Indexes & GIN Vectors | Foreign Keys & Triggers | Unique Business Constraints |
| :--- | :--- | :--- | :--- | :--- |
| **`users`** | `id` (bigint) | B-Tree on `email` | - | `UNIQUE(email)` |
| **`courses`** | `id` (bigint) | B-Tree on `slug`, GIN on `search_vector` | `instructor_id` Ref `users(id)` | `UNIQUE(slug)` |
| **`sections`** | `id` (bigint) | B-Tree on `course_id` | `course_id` Ref `courses(id)` | - |
| **`lectures`** | `id` (bigint) | B-Tree on `section_id` | `section_id` Ref `sections(id)` | - |
| **`enrollments`** | `id` (bigint) | B-Tree on `user_id`, `course_id` | Ref `users(id)`, Ref `courses(id)` | `UNIQUE(user_id, course_id)` |
| **`cart_items`** | `id` (bigint) | B-Tree on `user_id` | Ref `users(id)`, Ref `courses(id)` | `UNIQUE(user_id, course_id)` |
| **`orders`** | `id` (bigint) | B-Tree on `user_id`, `idempotency_key` | Ref `users(id)` | `UNIQUE(idempotency_key)` |
| **`lecture_progress`**| `id` (bigint) | B-Tree on `user_id`, `course_id` | Ref `users(id)`, `courses(id)`, `lectures(id)` | `UNIQUE(user_id, course_id, lecture_id)`|

---

## 4. Frontend Theme & Adaptive Design Tokens

EduFlow follows the **Udemy Premium Theme Guide**, extending Tailwind utility tags with the following design tokens:

* **`brand-purple` (`#A435F0`):** Udemy Purple. Used for checkout actions, rating aggregates, primary buttons, and progress tags. Hover actions scale to `brand-purple-hover` (`#8710D8`).
* **`brand-charcoal` (`#1C1D1F`):** Charcoal Black. Used for text headers, navigation backgrounds, dark outline borders, and settings form buttons. Hover states scale to `brand-charcoal-hover` (`#2D2F31`).
* **`brand-grey` (`#D1D7DC`):** Boundary Grey. Applied on table borders, settings grids, and form dividers.
* **`brand-gold` (`#B4690E`):** Star Star rating highlights.
* **`brand-bg` (`#F7F9FA`):** Soft Off-White. Applied on page backgrounds, sidebar drawers, and course navigation tabs.

### Responsiveness & Adaptive Viewports
* **Grid Layouts:** Uses Tailwind responsive grids (e.g. `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`) to ensure courses reorganize cleanly from mobile viewports to ultra-wide displays.
* **Header Collapse:** Search bar inputs collapse into a overlay popup icon on mobile devices, and drawer menus slide out from the right to hold user details.
* **Video Layouts:** Video player viewport boxes scale dynamically, keeping an aspect ratio of `16:9` across mobile screen dimensions.

---

## 5. Security & Authentication Routing

### Next.js Edge Middleware Protection (`middleware.ts`)
Authentication redirects run on Next.js Edge nodes before any page content loads:
- **Private Viewports:** Requests mapping to `/learn`, `/instructor`, `/admin`, `/my-courses`, or `/cart` require a valid JWT `accessToken` cookie. If not present, the user is redirected to `/login?redirect=<pathname>`.
- **Public Bypasses:** Authenticated sessions attempting to access `/login` or `/register` are automatically redirected back to the home route `/` to keep user paths logical.

### CORS Configuration Matrix
The backend permits communication with the frontend via the following CORS settings in `CorsConfig.java`:
- **Allowed Origin:** `http://localhost:3000`
- **Allowed Headers:** `Authorization`, `Content-Type`, `X-Requested-With`, `Accept`
- **Allowed Methods:** `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`
- **Credentials Support:** `true` (Crucial for passing HTTPS HttpOnly cookies like the session refresh tokens).
