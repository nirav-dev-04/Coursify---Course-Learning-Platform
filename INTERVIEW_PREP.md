# EduFlow: Technical Interview Cheat Sheet (20 Q&As)

This document contains the 20 exact answers explaining the technical design, configuration choices, and performance optimizations implemented in the **EduFlow** codebase. Keep this file in your project workspace for quick revision before interviews.

---

## 1. `PRD.md` — REST Endpoints Answer
The project has 18 REST endpoints covering auth, courses, cart, orders, progress, and enrollments. 
* **Auth:** register, login, Google OAuth, and refresh token. 
* **Courses:** listing with full-text search, detail view, and video pre-signed URL generation. 
* **Cart:** get, add, and delete. 
* **Orders:** checkout, verify, and webhook. 
* **Progress:** update and get. 
* **Enrollments:** my-courses list and check enrollment status.

---

## 2. `V1__init_schema.sql` — Database Answer
The schema creates 8 tables — users, courses, sections, lectures, enrollments, cart items, reviews, and orders. 
* **Key constraints:** `UNIQUE(user_id, course_id)` on `enrollments` to prevent duplicate purchases, `UNIQUE(user_id, course_id)` on `cart_items` to prevent cart duplication, and `UNIQUE(idempotency_key)` on `orders` to prevent duplicate payment transactions. 
* **Performance indexes:** B-Tree on foreign keys like `courses(instructor_id)`, `sections(course_id)`, `lectures(section_id)`, and a `UNIQUE` B-Tree index on `courses(slug)` for clean SEO routing. 
* **FTS:** Uses a GIN index on a generated `tsvector` column combining course title and description.

---

## 3. `V3__progress_table.sql` — Progress Table Answer
Progress tracking is in a separate migration because it was added after the initial schema as a design decision. The table stores `user_id`, `course_id`, `lecture_id`, and `percent` completed. However, the primary storage for progress is Redis — this table is only written to during the scheduled flush every 5 minutes, not on every update.

---

## 4. `DataSeeder.java` — Seeder Answer
`DataSeeder` reads the `udemy_courses.csv` file from resources on application startup using a `CommandLineRunner` bean. Before inserting anything, it checks if `courseRepository.count()` equals zero — if courses already exist, it skips seeding entirely to prevent duplicate records and constraint violations on restart. If the database is empty, it uses **JDBC batch inserts** to load all 300+ courses in one efficient database round trip instead of firing 300 individual INSERT statements.

---

## 5. `SecurityConfig.java` — Security Answer
Spring Security 6 is configured with stateless session management, meaning no `HttpSession` is created or used. The security filter chain marks public endpoints like register, login, Google auth, course listing, and the Razorpay webhook as `permitAll`. All other endpoints require a valid JWT. The `JwtAuthenticationFilter` runs before `UsernamePasswordAuthenticationFilter` and extracts the Bearer token from the `Authorization` header on every request.

---

## 6. `CorsConfig.java` — CORS Answer
The frontend runs on port 3000 and the backend runs on port 8080. Without CORS configuration, the browser blocks every API call with a CORS policy error before the request even reaches Spring Boot. `CorsConfig` allows origin `http://localhost:3000`, permits all standard HTTP methods, allows `Authorization` and `Content-Type` headers, and enables credentials so the `httpOnly` refresh token cookie is transmitted with requests.

---

## 7. `RazorpayConfig.java` — Payment Answer
`RazorpayConfig` initializes the `RazorpayClient` bean using the key ID and key secret pulled from environment variables via `application.yml`. This bean is injected into `OrderService` to create checkout orders and into `WebhookController` to verify webhook HMAC signatures. Keys are never hardcoded — they come from `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` environment variables.

---

## 8. `CloudFrontConfig.java` — Video Security Answer
`CloudFrontConfig` sets up the AWS CloudFront cookie signer using a private RSA key file and a CloudFront key pair ID. When a student hits the learn page, the backend verifies their enrollment and generates three signed cookies — `CloudFront-Signature`, `CloudFront-Key-Pair-Id`, and `CloudFront-Policy`. These cookies are set as `httpOnly`, secure, and domain-restricted. 

The browser automatically attaches these cookies to every HLS chunk request — both the `.m3u8` playlist and all `.ts` segment files — for 15 minutes. This is superior to signed URLs because one cookie set secures hundreds of video chunks instead of generating individual signed URLs for each chunk.

---

## 9. `AsyncConfig.java` — Async Answer
`AsyncConfig` defines a custom thread pool executor for video transcoding tasks. The pool has a limited number of threads so transcoding jobs do not consume all server resources under heavy upload load. HLS transcoding is triggered via Spring's `@Async` annotation on `HlsTranscoderService` methods, meaning the upload endpoint returns immediately to the instructor while `ffmpeg` processes the video in the background on a separate thread.

---

## 10. `S3Config.java` — Upload Answer
`S3Config` initializes the AWS `S3Client` bean with the configured region and credentials. For video uploads, the backend generates a pre-signed PUT URL using this client and returns it to the instructor's browser. The browser uploads the video file directly to S3 using that URL without the file ever passing through the Spring Boot server. This avoids memory pressure, eliminates upload size limits on the server, and reduces bandwidth costs.

---

## 11. `CourseRepository.java` — Query Answer
`CourseRepository` solves the N+1 problem using a JPQL query that returns a `CourseListDTO` interface projection instead of loading full `Course` entities. The query uses `JOIN FETCH` to get the instructor name and `LEFT JOIN` to calculate the average rating in a single SQL statement. 

For search, it uses a native PostgreSQL query with `plainto_tsquery` matching against the pre-built `tsvector` column using the `@@` operator, which hits the GIN index instead of doing a sequential table scan.

---

## 12. `OrderRepository.java` — Lock Answer
`OrderRepository` has a `findByIdempotencyKey` method annotated with `@Lock(LockModeType.PESSIMISTIC_WRITE)` and `@Transactional` with `SERIALIZABLE` isolation. When a Razorpay webhook arrives, Spring acquires a row-level write lock on that order before reading its status. If a second webhook arrives simultaneously, it blocks at the database level until the first transaction completes. 

This prevents two threads from both seeing status `PENDING` and both triggering the enrollment flow. If a duplicate idempotency key is inserted, the database throws `DataIntegrityViolationException`, which `GlobalExceptionHandler` catches and returns 200 OK with the existing order response.

---

## 13. `middleware.ts` — Route Protection Answer
Next.js middleware runs on the Edge before any page renders. It reads the `accessToken` cookie from the incoming request. If the request is going to a protected route like `/learn`, `/instructor`, `/admin`, `/my-courses`, or `/cart` and no token exists, it redirects to `/login`. If the request is going to `/login` or `/register` and a token already exists, it redirects to the home page `/` to prevent authenticated users from seeing auth pages. This protects every route without client-side JavaScript running first.

---

## 14. `useCartStore.ts` — Cart Answer
`useCartStore` is a Zustand store. The `addItem` function checks if the course already exists in the items array before adding — preventing duplicates. The `removeItem` function filters by `courseId`. For optimistic updates, React Query's `onMutate` callback updates the cart cache immediately when an item is added, and `onError` rolls back to the previous cart state if the API call fails.

---

## 15. `useAuth.ts` — Auth Answer
`useAuth` is a Zustand store managing the in-memory access token and user object. 
* The `login` function calls `POST /api/auth/login`, stores the returned access token in a JavaScript variable using `setAccessToken`, then updates the user state. 
* The `loginWithGoogle` function does the same but sends the Google ID token to `POST /api/auth/google` first. 
* The `logout` function calls `POST /api/auth/logout` to clear the refresh cookie and clears the in-memory token. 
* The `checkSession` function is called on app load to rehydrate the user session using the `httpOnly` refresh cookie.

---

## 16. `VideoPlayer.tsx` — Player Answer
`VideoPlayer` is a React component wrapping HLS.js. On mount, it creates an `Hls` instance, attaches it to a video HTML element via a React ref, and loads the `.m3u8` playlist URL. Since the browser already has the CloudFront signed cookies set by the backend, every `.m3u8` and `.ts` chunk request automatically includes those cookies — no extra headers needed. 

The component sends a progress heartbeat to `PUT /api/progress/{courseId}/{lectureId}` every 10 seconds using the video element's `timeupdate` event. On unmount, it destroys the `Hls` instance to prevent memory leaks.

---

## 17. `LearnNavbar.tsx` — Navbar Answer
The global `Navbar.tsx` is hidden on all `/learn` routes via the root layout checking the current pathname. `LearnNavbar.tsx` replaces it with a minimal top bar showing a back arrow that returns to the student dashboard, the course title, the current watch progress percentage, and a share button. This matches Udemy's exact behavior on their player page.

---

## 18. `tailwind.config.js` — Styling Answer
The Tailwind config extends the default theme with a brand color object mapping Udemy's exact hex values to named tokens. 
* `brand-purple` maps to `#A435F0` for primary buttons and links.
* `brand-purple-hover` maps to `#8710D8` for hover states.
* `brand-charcoal` maps to `#1C1D1F` for dark text and backgrounds.
* `brand-grey` maps to `#D1D7DC` for borders and dividers.
* `brand-gold` maps to `#B4690E` for rating stars.
* `brand-bg` maps to `#F7F9FA` for soft page backgrounds.
Using named tokens means the entire color system can be updated in one place.

---

## 19. `next.config.js` — Config Answer
`next.config.js` defines allowed image domains including Google profile picture URLs, the S3 bucket domain for course thumbnails, and the CloudFront domain for CDN assets. It also defines an API rewrite rule that proxies all `/api/*` requests from the Next.js dev server to `http://localhost:8080` so the frontend never hardcodes the backend port in component code.

---

## 20. `package.json` — Dependencies Answer
Key dependency choices include:
* `axios` for API calls with interceptor support for silent token refresh.
* `framer-motion` for smooth page transitions and button animations.
* `@react-oauth/google` for the Google OAuth consent popup.
* `hls.js` for adaptive bitrate video playback.
* `recharts` for instructor revenue and enrollment charts.
* `zustand` for lightweight client state without Redux boilerplate.
* `@tanstack/react-query` for server state with background refetching and optimistic updates.
* `clsx` and `tailwind-merge` as utilities used internally by components.
