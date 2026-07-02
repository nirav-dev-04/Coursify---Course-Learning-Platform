# Coursify: Complete System Walkthrough & Feature Trace

Coursify is an enterprise-grade, high-fidelity Udemy clone designed with a Next.js 14 frontend, a Spring Boot 3 backend, a PostgreSQL relational database, and a Redis caching buffer layer. This document provides a detailed, part-by-part technical walkthrough of the system, covering both the **Student** and **Instructor** roles.

---

## 1. System Architecture Overview

Coursify uses a decoupled client-server architecture with optimized data persistence:
* **Frontend:** Next.js (using the modern App Router), styling with Tailwind CSS, client state via Zustand, and API fetching with Axios and React Query.
* **Backend:** Spring Boot with modules organized logically under the package `com.coursify.modules`. Relational migrations are handled automatically by Flyway.
* **Cache & Storage:** Redis stores temporary, high-frequency user progress ticks to prevent database write bottlenecks and caches dashboard aggregates. AWS S3 holds raw and transcoded video files, secured via AWS CloudFront signed cookies.

### High-Level System Flow
```mermaid
graph TD
    Client[Next.js Frontend] -->|API Requests| Gateway[Spring Security 6 Gatekeeper]
    Gateway -->|Rate Limiting Filter| RateLimit[RateLimitingFilter (Bucket4j)]
    RateLimit -->|Filter Checks| Auth[AuthController]
    RateLimit -->|Protected API| UserCtrl[UserController]
    RateLimit -->|Protected API| CourseCtrl[CourseController]
    RateLimit -->|Protected API| OrderCtrl[OrderController]
    RateLimit -->|Protected API| ProgressCtrl[ProgressController]
    RateLimit -->|Protected API| CertCtrl[CertificateController]
    RateLimit -->|Protected API| DiscCtrl[DiscussionController]

    ProgressCtrl -->|High-Write Buffering & Stats Cache| Redis[(Redis Caching Layer)]
    ProgressCtrl -->|Fallback / Persistent Store| PG[(PostgreSQL DB)]
    
    OrderCtrl -->|Razorpay Verification| PG
    CertCtrl -->|OpenPDF Engine| PDF[A4 Certificate PDF]
    
    Scheduler[Spring Scheduled Cron Task] -->|Batch DB Sync - Every 5m| Redis
    Scheduler -->|Flushes Dirty Records| PG
```

---

## 2. Shared Foundation: Auth, Security & Rate Limiting

### A. Stateless Authentication & Refresh Token Rotation (RTR)
* **Sign Up & Log In:** 
  - [AuthController.java](file:///c:/Users/nirav/Desktop/Udemi/backend/src/main/java/com/coursify/modules/auth/AuthController.java) exposes `/api/v1/auth/register` and `/api/v1/auth/login`.
  - On successful login, the backend generates a short-lived Access Token returned in the JSON response body, and sets a long-lived Refresh Token in an `httpOnly`, secure, domain-scoped HTTP cookie.
  - Social login is supported via Google OAuth `/api/v1/auth/google`, validating the Google authentication ID token and mapping it to a local User entity.
* **Refresh Token Rotation (RTR):**
  - To prevent replay attacks from stolen refresh tokens, Coursify implements Refresh Token Rotation.
  - When the client calls `/api/v1/auth/refresh`, the backend verifies the current refresh token. Upon validation, the server immediately **invalidates** the old refresh token, generates a **new refresh token**, and issues a new access token. Both are transmitted back to the client (refresh token via `Set-Cookie`). If a token refresh request is made with an invalidated refresh token, the server immediately revokes all active sessions for that user to mitigate potential theft.
* **Zustand Client Store:**
  - [useAuth.ts](file:///c:/Users/nirav/Desktop/Udemi/frontend/src/hooks/useAuth.ts) manages the in-memory access token and active user profile state.
  - Axios interceptor ([api.ts](file:///c:/Users/nirav/Desktop/Udemi/frontend/src/lib/api.ts)) automatically injects the `Authorization: Bearer <token>` header to outgoing requests. If a request returns a `401 Unauthorized` status, the interceptor silently calls `/api/v1/auth/refresh` to fetch a new access token and retries the original request seamlessly.
* **Edge Route Protection:**
  - [middleware.ts](file:///c:/Users/nirav/Desktop/Udemi/frontend/src/middleware.ts) runs on Next.js Edge nodes before any page content renders. It intercepts path requests (e.g., `/learn`, `/instructor`, `/my-courses`, `/cart`) and redirects requests lacking a valid `accessToken` cookie to the `/login` route, protecting client views.

### B. Security Filters & Active Rate Limiting
* **IP-based Rate Limiting:**
  - To prevent brute-force attacks on sensitive endpoints (e.g., login or webhook calls), a dedicated filter is implemented in [RateLimitingFilter.java](file:///c:/Users/nirav/Desktop/Udemi/backend/src/main/java/com/coursify/security/RateLimitingFilter.java) using the **Bucket4j** library.
  - The filter intercepts all routes starting with `/api/v1/`, parses the client IP address (supporting proxy forwarding headers like `X-Forwarded-For`), and maps it to a concurrent token bucket cache (`ConcurrentHashMap`).
  - It permits a limit of **100 requests per minute per IP**, refilling tokens continuously. If exceeded, the filter short-circuits the pipeline and returns a `429 Too Many Requests` HTTP error response.
* **CORS Handling:**
  - [CorsConfig.java](file:///c:/Users/nirav/Desktop/Udemi/backend/src/main/java/com/coursify/config/CorsConfig.java) permits browser operations from the frontend origin `http://localhost:3000`, enabling support for the `Authorization` header and credentials transport (required to carry the httpOnly session refresh cookies).

---

## 3. Student Role: Core Feature Breakdown & Trace

The Student Role includes everything a learner needs to browse, buy, watch, discuss, and earn certificates.

### A. Course Discovery, Searching & Pagination
* **Frontend View:** [courses/page.tsx](file:///c:/Users/nirav/Desktop/Udemi/frontend/src/app/courses/page.tsx) handles catalog searching.
* **Fuzzy Full-Text Search:**
  - Standard relational searches using `LIKE` can cause performance degradation. Coursify implements a native PostgreSQL **GIN (Generalized Inverted Index)** on a generated `tsvector` column combining course title and description.
  - The FTS check executes in [CourseRepository.java](file:///c:/Users/nirav/Desktop/Udemi/backend/src/main/java/com/coursify/modules/course/CourseRepository.java) using the PostgreSQL `@@` operator. If fuzzy matching yield is low (e.g., matching a single letter query), the repository falls back to a title/category substring scan to guarantee relevant suggestion autocomplete results.
* **Spring Data Pagination:**
  - To scale with a large course catalog, the `/api/v1/courses` endpoint supports pagination.
  - The [CourseController.java](file:///c:/Users/nirav/Desktop/Udemi/backend/src/main/java/com/coursify/modules/course/CourseController.java) accepts Spring Data `Pageable` parameters (e.g., `?page=0&size=20&sort=price,desc`). The controller delegates this to the JPA repository, returning a paginated metadata response (total elements, total pages, content list) instead of loading the entire catalog into memory.
* **Conditional HTTP ETag Caching:**
  - The `getCourses` endpoint automatically computes an ETag hash from the returned course payload list.
  - If a student makes a query and the course catalog has not changed, the browser sends the current tag in the `If-None-Match` header. The Spring controller evaluates it and immediately returns a `304 Not Modified` response with no body content, conserving server bandwidth.

### B. Shopping Cart & Discount Coupon Validation
* **Zustand Cart Manager:** [useCartStore.ts](file:///c:/Users/nirav/Desktop/Udemi/frontend/src/store/useCartStore.ts) performs optimistic UI updates when adding/removing items, falling back if the API responds with an error.
* **Discount Code Verification:**
  - When the student enters a promo code, the checkout form hits the coupon endpoint.
  - [CouponService.java](file:///c:/Users/nirav/Desktop/Udemi/backend/src/main/java/com/coursify/modules/coupon/CouponService.java) handles the logic. It verifies whether the coupon exists, has expired, is exhausted (reached `maxUses`), requires a minimum order amount, or applies specifically to a single course ID.
  - It calculates the absolute markdown value (either a percentage reduction or flat price offset) and returns the discounted subtotal.

### C. Razorpay Checkout, Webhooks & Pessimistic Locks
* **Order Creation (Idempotent):**
  - Clicking "Enroll Now" calls `POST /api/v1/orders/checkout`. A frontend UUID-based `idempotencyKey` prevents duplicate transaction creation if checkout buttons are double-clicked.
  - The [OrderService.java](file:///c:/Users/nirav/Desktop/Udemi/backend/src/main/java/com/coursify/modules/payment/OrderService.java) creates a database order in `PENDING` state and invokes the `RazorpayClient` to obtain a remote payment identifier (`razorpayOrderId`).
* **Verification Paths & Webhook Security:**
  - **Redirect Handler:** The browser receives the Razorpay popup completion payload and posts verification parameters to `/api/v1/orders/verify` to calculate a SHA-256 HMAC signature.
  - **Webhook Callback:** Webhooks are handled by [WebhookController.java](file:///c:/Users/nirav/Desktop/Udemi/backend/src/main/java/com/coursify/modules/payment/WebhookController.java). To secure this public endpoint, the controller validates the signature:
    ```java
    isValid = calculateHmacSha256(payload, webhookSecret).equals(signatureHeader);
    ```
    If the computed signature doesn't match the incoming `X-Razorpay-Signature` header, the request is rejected with a `PaymentException`.
* **Double-Enrollment Prevention (Pessimistic Locking):**
  - To prevent race conditions where standard redirects and webhook notifications attempt to verify the order simultaneously, the system uses pessimistic write locks.
  - `OrderRepository.findByRazorpayOrderIdWithLock(...)` runs `SELECT ... FOR UPDATE`, forcing secondary threads to wait until the first thread checks the order status, changes it to `SUCCESS`, creates the `Enrollment` rows, clears the shopping cart, and finishes the transaction.

### D. Private Video Playback & Adaptive Progress Caching
* **HLS Player Page:** [learn/[courseId]/page.tsx](file:///c:/Users/nirav/Desktop/Udemi/frontend/src/app/learn/[courseId]/page.tsx) uses `hls.js` to play secure `.m3u8` playlists and `.ts` chunk segments.
* **CloudFront signed cookies:**
  - To secure premium video files on S3/CloudFront, the player requests credentials from the backend. The backend sets secure, domain-restricted `httpOnly` signed cookies (`CloudFront-Signature`, `CloudFront-Key-Pair-Id`, `CloudFront-Policy`).
  - HLS video fragment HTTP calls automatically transmit these cookies, bypassing token injection on media requests.
* **Progress Heartbeat (Redis Buffer & SQL Fallbacks):**
  - High-volume progress writes can cause database bottlenecks. The player tracks active playback and makes a progress API call `/api/v1/progress` every 10 seconds.
  - [ProgressTracker.java](file:///c:/Users/nirav/Desktop/Udemi/backend/src/main/java/com/coursify/modules/progress/ProgressTracker.java) writes the watch state directly into a Redis Hash (`user:progress:<userId>:<courseId>`) and marks it in a dirty Set (`user:progress:dirty`).
  - **Fallback Strategy:** If Redis goes offline, the tracking handler catches the connection exception and immediately falls back to direct database writes (`progressRepository.save(progress)`) to prevent progress loss. Reconnections are handled automatically by the lettuce client background threads.
  - A scheduled Spring Cron job in [ProgressFlushScheduler.java](file:///c:/Users/nirav/Desktop/Udemi/backend/src/main/java/com/coursify/modules/progress/ProgressFlushScheduler.java) runs every 5 minutes to read the Redis dirty keys, fetch the latest percentages, and execute a bulk database update.

### E. Q&A / Lecture Discussions & Pagination
* **Discussion Threads & Replies Pagination:**
  - Under [learn/[courseId]/page.tsx](file:///c:/Users/nirav/Desktop/Udemi/frontend/src/app/learn/[courseId]/page.tsx), students can open a Q&A panel to view, search, and post questions tied to a specific video playback timestamp.
  - The thread resolver endpoint `/api/v1/discussions/course/{courseId}` implements **Spring Data Pageable** pagination, returning a chunked set of threads per request to maintain minimal load times.
  - Furthermore, nested discussion replies within a thread are also paginated via `/api/v1/discussions/threads/{threadId}/replies` to prevent browser rendering lags on extremely popular threads with hundreds of comments.
  - [DiscussionService.java](file:///c:/Users/nirav/Desktop/Udemi/backend/src/main/java/com/coursify/modules/discussion/DiscussionService.java) handles database lookups, reply maps, and formats user avatars.

### F. Certificate Registry & PDF Generation
* **Completion Verification:** When progress reaches 100% of all lectures in the course, the frontend unlocks the "Download Certificate" action.
* **Issued Certificate Registry:**
  - To prevent CPU-intensive PDF regeneration every time a student clicks "Download Certificate", Coursify uses a dedicated database registry (`certificates` table).
  - When the endpoint `/api/v1/certificates/download/{courseId}` in [CertificateController.java](file:///c:/Users/nirav/Desktop/Udemi/backend/src/main/java/com/coursify/modules/certificate/CertificateController.java) is hit, the backend checks the registry. If a record exists, it immediately returns the cached certificate hash or redirects to the stored file.
  - If it is the first download, [CertificateService.java](file:///c:/Users/nirav/Desktop/Udemi/backend/src/main/java/com/coursify/modules/certificate/CertificateService.java) generates the landscape A4 PDF on the fly using the OpenPDF library, saves its signature record to the database, and prompts the browser download.

---

## 4. Instructor Role: Core Feature Breakdown & Trace

The Instructor Role enables users to switch roles, review dashboard stats, construct curricula, and securely upload videos.

### A. Role Upgrading (Become Instructor)
* **Onboarding View:** [instructor/onboarding/page.tsx](file:///c:/Users/nirav/Desktop/Udemi/frontend/src/app/instructor/onboarding/page.tsx) guides students through upgrading their accounts.
* **Role Conversion Endpoint:**
  - The "Become Instructor" form submits a request to `POST /api/v1/users/me/become-instructor` in [UserController.java](file:///c:/Users/nirav/Desktop/Udemi/backend/src/main/java/com/coursify/modules/user/UserController.java).
  - The service updates the user's role string to `INSTRUCTOR` and saves the entity. Next.js router middleware reads the updated cookie roles, transitioning navigation links and granting portal access.

### B. Analytical Dashboard & Redis Caching
* **Instructor Portal:** [instructor/dashboard/page.tsx](file:///c:/Users/nirav/Desktop/Udemi/frontend/src/app/instructor/dashboard/page.tsx) renders dynamic analytics.
* **Intensive Aggregation Caching:**
  - Retrieving instructor metrics (e.g., student enrollment numbers, total earnings sums) requires computing joins and aggregations on the `enrollments` table.
  - To keep the dashboard responsive, the endpoint `/api/v1/courses/instructor/stats` utilizes **Spring Cache** backed by Redis:
    ```java
    @Cacheable(value = "instructorStats", key = "#userPrincipal.id")
    public InstructorStatsDTO getInstructorStats(UserPrincipal userPrincipal) { ... }
    ```
  - **Cache Eviction:** When a student successfully completes a purchase, the payment webhook listener calls `@CacheEvict(value = "instructorStats", key = "#instructorId")` to invalidate the cache, ensuring the instructor see updated stats.

### C. Course Creation & Curricular Builder (4-Tab Editor)
* **Course CRUD Setup:** Instructors create courses under [instructor/courses/create/page.tsx](file:///c:/Users/nirav/Desktop/Udemi/frontend/src/app/instructor/courses/create/page.tsx). The backend auto-generates SEO-friendly URL slugs.
* **Course Soft-Deletion Design Pattern:**
  - If an instructor deletes a course that already has enrolled students, a hard delete would cause those student records to disappear or break foreign keys.
  - Coursify implements a **Soft Delete** pattern. The `courses` and `lectures` tables contain an `is_deleted` column.
  - When the delete action is triggered, the server sets `is_deleted = true`. The public catalog query excludes deleted courses, but the learn player dashboard still permits access for existing students with valid enrollments.
* **Course Tabs Editor:** Course editing is handled in [instructor/courses/[id]/edit/page.tsx](file:///c:/Users/nirav/Desktop/Udemi/frontend/src/app/instructor/courses/[id]/edit/page.tsx), which contains a 4-tab panel:
  * **Tab 1: Course Info:** Forms to edit the title, description, category, and price. Includes a toggle to switch status between Draft, Pending Review, and Published.
  * **Tab 2: Curriculum Builder:** A nested drag-and-drop hierarchy listing Course Sections and Lectures. Instructors can perform CRUD operations on sections and lectures, set preview permissions, and manage sort orders.
  * **Tab 3: Video Manager & AWS Transcoding Pipeline:**
    - To prevent server bottlenecks, large videos are uploaded directly to AWS S3 via pre-signed S3 upload URLs obtained from [VideoUploadController.java](file:///c:/Users/nirav/Desktop/Udemi/backend/src/main/java/com/coursify/modules/course/VideoUploadController.java) `/api/v1/courses/{courseId}/video-presigned-url`.
    - **AWS Transcoding Pipeline:** Once the raw `.mp4` is uploaded to the raw S3 folder, a serverless cloud pipeline handles HLS conversion:
      1. S3 triggers an **ObjectCreated event** callback to an **AWS Lambda function**.
      2. The Lambda function initiates an **AWS Elemental MediaConvert** job.
      3. MediaConvert transcodes the raw MP4 file into adaptive HLS formats (`.m3u8` index stream and `.ts` video chunks).
      4. **Transcoding Status Webhook:** Once MediaConvert finishes, it emits a status event to **AWS SNS**, which forwards a POST request to the Spring Boot endpoint `/api/v1/media/webhook`. To secure this endpoint, the backend verifies the AWS SNS message signature prior to processing. On validation, the backend updates the lecture's `video_status` column (`PENDING_UPLOAD`, `PROCESSING`, `READY`, `FAILED`).
      5. The frontend displays a loading spinner with a "Processing video..." tag until polling checks indicate the status has changed to `READY`.
  * **Tab 4: Settings:** Actions to duplicate course properties, toggle visibility, or soft-delete the course draft.

---

## 5. Input Validation & Error Handling Layer

### A. Bean Validation DTOs
All request payloads are validated using Spring Boot's validation annotations (e.g., `@NotBlank`, `@Email`, `@Size`, `@Min`). For instance:
* [SecurityUpdateRequest.java](file:///c:/Users/nirav/Desktop/Udemi/backend/src/main/java/com/coursify/modules/user/dto/SecurityUpdateRequest.java) enforces size guidelines on new passwords and email formatting rules.
* Input validation is checked at the controller entry point using the `@Valid` annotation.

### B. Global Rest Controller Advice
All controller exceptions are processed centrally in [GlobalExceptionHandler.java](file:///c:/Users/nirav/Desktop/Udemi/backend/src/main/java/com/coursify/exception/GlobalExceptionHandler.java):
* `MethodArgumentNotValidException`: Catches field validation failures, aggregates all errors, and maps them to a structured field-to-error message response with a `400 Bad Request` status.
* Custom exceptions (`ResourceNotFoundException`, `PaymentException`, `CartConflictException`) are captured and translated into standardized JSON error responses containing the HTTP status, description, and timestamp.

---

## 6. REST API & Endpoint Matrix

| Package/Module | HTTP Method | Endpoint URI | Auth Requirement | Backend Handler Method | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`auth`** | POST | `/api/v1/auth/register` | PermitAll | `registerUser(...)` | Creates standard user profiles. |
| **`auth`** | POST | `/api/v1/auth/login` | PermitAll | `loginUser(...)` | Validates credentials; sets refresh token cookie. |
| **`auth`** | POST | `/api/v1/auth/google` | PermitAll | `googleLogin(...)` | Validates Google authentication ID token. |
| **`auth`** | POST | `/api/v1/auth/refresh` | PermitAll | `refreshToken(...)` | Rotates access token & refresh token. |
| **`user`** | GET | `/api/v1/users/me/profile` | Authenticated | `getMyProfile(...)` | Returns active user profile metadata. |
| **`user`** | PUT | `/api/v1/users/me/profile` | Authenticated | `updateMyProfile(...)` | Updates user biography, links, and avatar. |
| **`user`** | POST | `/api/v1/users/me/become-instructor` | Authenticated | `becomeInstructor(...)` | Upgrades role to `INSTRUCTOR`. |
| **`course`** | GET | `/api/v1/courses` | PermitAll | `searchAndListCourses(...)` | Search with Spring Data `Pageable` & ETags. |
| **`course`** | GET | `/api/v1/courses/{slug}` | PermitAll | `getCourseDetails(...)` | Returns course details, sections, and lectures. |
| **`course`** | POST | `/api/v1/courses` | Instructor | `createCourse(...)` | Instantiates a new course entity. |
| **`course`** | PUT | `/api/v1/courses/{id}` | Instructor | `updateCourse(...)` | Updates course details, curriculum, and settings. |
| **`course`** | POST | `/api/v1/courses/{courseId}/video-presigned-url` | Instructor | `getPreSignedUploadUrl(...)` | Generates S3 upload credentials. |
| **`course`** | GET | `/api/v1/courses/instructor/stats` | Instructor | `getInstructorStats(...)` | Analytics with Redis caching & evictions. |
| **`cart`** | GET | `/api/v1/cart` | Authenticated | `getCartItems(...)` | Returns items in the shopping cart. |
| **`cart`** | POST | `/api/v1/cart` | Authenticated | `addToCart(...)` | Appends course ID to cart (enforces unique check). |
| **`cart`** | DELETE | `/api/v1/cart/{id}` | Authenticated | `removeFromCart(...)` | Removes a course from the cart. |
| **`coupon`** | GET | `/api/v1/coupons/validate` | Authenticated | `validateCoupon(...)` | Validates promo codes and discounted totals. |
| **`payment`** | POST | `/api/v1/orders/checkout` | Authenticated | `checkout(...)` | Creates pending order and Razorpay order ID. |
| **`payment`** | POST | `/api/v1/orders/verify` | Authenticated | `verifyRedirect(...)` | Verifies signature from checkout redirect. |
| **`payment`** | POST | `/api/v1/orders/webhook` | PermitAll | `verifyWebhook(...)` | Callback verification with HMAC-SHA256. |
| **`progress`** | PUT | `/api/v1/progress` | Authenticated | `updateProgress(...)` | Buffers watch percentage into Redis. |
| **`progress`** | GET | `/api/v1/progress/{courseId}`| Authenticated | `getProgress(...)` | Returns watched lectures percentage mapping. |
| **`discussion`**| GET | `/api/v1/discussions/course/{id}`| Authenticated | `getThreads(...)` | Returns Q&A threads with `Pageable` pagination. |
| **`discussion`**| POST | `/api/v1/discussions/threads` | Authenticated | `createThread(...)` | Posts a new question thread at a video timestamp. |
| **`discussion`**| POST | `/api/v1/discussions/replies` | Authenticated | `createReply(...)` | Appends reply text to an active thread. |
| **`discussion`**| GET | `/api/v1/discussions/threads/{id}/replies`| Authenticated | `getThreadReplies(...)` | Returns paginated replies for a thread. |
| **`certificate`**| GET | `/api/v1/certificates/download/{id}`| Authenticated | `downloadCertificate(...)` | Registry lookup & landscape A4 PDF download. |
| **`media`** | POST | `/api/v1/media/webhook` | PermitAll | `handleTranscodeWebhook(...)`| Updates video status fields based on MediaConvert. |

---

## 7. Relational Database Schema & Constraints

```
  ┌───────────┐         ┌───────────┐         ┌──────────────┐
  │   users   │◄────────┤  courses  │◄────────┤   sections   │
  └─────┬─────┘         └─────┬─────┘         └──────┬───────┘
        │                     │                      │
        │                     ▼                      ▼
        │               ┌───────────┐         ┌──────────────┐
        ├──────────────►│enrollments│         │   lectures   │
        │               └───────────┘         └──────┬───────┘
        │                                            │
        │                                            ▼
        │                                     ┌──────────────┐
        └────────────────────────────────────►│prog/discussions
                                              └──────────────┘
```

The database structure is designed to enforce data integrity:
1. **Enrollments:** `uq_enrollments_user_course UNIQUE(user_id, course_id)` prevents double enrollment.
2. **Shopping Cart:** `uq_cart_items_user_course UNIQUE(user_id, course_id)` prevents cart item duplication.
3. **Discussions:** Index optimization on `idx_threads_course` and `idx_replies_thread` ensures thread load times scale efficiently as Q&A activity grows.
4. **Lecture Progress:** `uq_progress_user_course_lecture UNIQUE(user_id, course_id, lecture_id)` ensures only one progress percentage is stored per user per lecture.
5. **Certificates:** `uq_certificates_user_course UNIQUE(user_id, course_id)` Registry constraint mapping issued records.
6. **Soft Delete Filter:** Relational queries filter records using `is_deleted = false` unless loading enrolled student playbooks.
7. **FTS Vectors:** Generated `tsvector` columns are computed on write and mapped with a GIN index on `courses(search_vector)`.
