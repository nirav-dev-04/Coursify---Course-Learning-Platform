# Coursify — Full-Stack EdTech Learning Platform

Coursify is a full-stack, production-style e-learning platform (Udemy-style) built to demonstrate real-world backend engineering: secure video streaming, payment processing, caching strategy, and scalable API design — not just CRUD.

**Live Demo:** [coursify-learn.vercel.app](https://coursify-learn.vercel.app)
**Backend API:** [coursify-course-learning-platform.onrender.com](https://coursify-course-learning-platform.onrender.com)

> ⚠️ **Note:** The backend is hosted on Render's free tier, which spins down after periods of inactivity. The first request after idle time may take 30–50 seconds to respond while the server wakes up. Subsequent requests are fast.

---

## Features

- **Secure Video Streaming** — HLS video delivery via AWS CloudFront signed cookies, with content stored on S3 and transcoded via AWS MediaConvert/Lambda
- **Payments** — Razorpay integration with idempotency keys and pessimistic locking to prevent duplicate charges/race conditions
- **Authentication** — JWT-based auth with httpOnly cookie rotation for secure session handling
- **Performance Caching** — Redis write-back caching for video watch progress, reducing database load
- **Course Creation Wizard** — 4-step guided flow for instructors to publish courses
- **Instructor Dashboard** — Course management, enrollment analytics, and performance stats
- **Fully Responsive** — Optimized layouts across mobile, tablet, and desktop breakpoints
- **End-to-End Tested** — Playwright test suite covering critical user flows (100% passing)

---

## Tech Stack

**Frontend**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS

**Backend**
- Spring Boot 3
- PostgreSQL (hosted on Supabase, via connection pooler)
- Redis
- JWT Authentication

**Infrastructure & Third-Party Services**
- AWS S3 — video/asset storage
- AWS CloudFront — signed-cookie video delivery
- AWS Lambda + MediaConvert — video transcoding pipeline
- Razorpay — payment processing
- Deployed via Vercel (frontend) + Render (backend)

**Testing**
- Playwright (E2E)

---

## Architecture Overview

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│   Next.js    │◄────►│  Spring Boot  │◄────►│   PostgreSQL     │
│  (Vercel)    │      │   (Render)    │      │   (Supabase)     │
└─────────────┘      └──────┬───────┘      └─────────────────┘
                             │
                    ┌────────┼────────┐
                    ▼        ▼        ▼
                 Redis   Razorpay   AWS (S3, CloudFront,
                (Cache)  (Payments)  Lambda, MediaConvert)
```

---

## Getting Started (Local Development)

### Prerequisites
- Node.js 18+
- Java 17+
- PostgreSQL instance (or Supabase project)
- Redis instance

### Backend Setup
```bash
cd backend
cp .env.example .env   # fill in your DB, Redis, AWS, Razorpay credentials
./mvnw spring-boot:run
```

### Frontend Setup
```bash
cd frontend
cp .env.example .env.local   # fill in API URL and any public keys
npm install
npm run dev
```

The frontend will run on `http://localhost:3000` and the backend on `http://localhost:8080` (or your configured port).

---

## Environment Variables

Both `backend/.env.example` and `frontend/.env.local.example` list the required variables. Key ones include:

| Variable | Description |
|---|---|
| `SPRING_DATASOURCE_URL` | PostgreSQL connection string (use Supabase's Session Pooler for IPv4 compatibility) |
| `SPRING_DATASOURCE_USERNAME` / `PASSWORD` | Database credentials |
| `CORS_ALLOWED_ORIGINS` | Comma-separated list of allowed frontend origins |
| `JWT_SECRET` | Secret key for signing JWTs |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Payment gateway credentials |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | AWS credentials for S3/CloudFront |
| `NEXT_PUBLIC_API_URL` | Backend API base URL (frontend) |

---

## Testing

```bash
cd frontend
npx playwright test
```

---

## Known Limitations

- Backend hosted on Render's free tier — subject to cold-start delay after inactivity
- [Add any other current limitations here]

---

## Screenshots
                                                                      STUDENT FETURES
1)Home Page
<img width="1901" height="917" alt="{35EC2E42-E0A9-4CFF-9B96-CADC87674597}" src="https://github.com/user-attachments/assets/0ed3eee3-550b-4a88-9a48-37a54443bf95" />

2)Register/Login Page
<img width="1898" height="902" alt="{543CE603-D109-431F-9AF0-408D0C5BD08B}" src="https://github.com/user-attachments/assets/dffe2c48-76a5-4f6a-bbab-cdd891d469d6" />
<img width="1916" height="920" alt="{6509F832-4276-44E4-A0F7-0DF6C5848BA7}" src="https://github.com/user-attachments/assets/ffaa72a3-9fdf-4eb9-bd54-7bb65d99bdec" />

3)Course Filter List
<img width="1898" height="913" alt="{70BEA150-0264-409C-958A-DB27124C2EA7}" src="https://github.com/user-attachments/assets/e52244e0-ab6d-477e-891a-2c3bc4e7b8a7" />

4)Course overview page
<img width="971" height="911" alt="{657C854E-CB10-4DBC-9895-90AF0289D8E2}" src="https://github.com/user-attachments/assets/666197eb-2a99-4f7b-8fed-d16cd0465217" />

5)Course Buying
<img width="1128" height="849" alt="{6EC115A1-78F9-47BD-B9E8-490A7E8D2313}" src="https://github.com/user-attachments/assets/6b8139d6-9981-46d8-bd21-2322d204acb7" />

6)RezorPay Test Mode
<img width="1888" height="919" alt="{B88DB069-6404-4D27-A0AB-F86A304D00B3}" src="https://github.com/user-attachments/assets/7f04b37f-6db5-40b7-864f-aacc3d42cdf4" />

                                                                      INSTRUCTRE FETURES

1)Instructure Dashboard
<img width="933" height="862" alt="{90C3DBBC-D3EB-4BAF-9DA9-8586EE0B9D3F}" src="https://github.com/user-attachments/assets/cc4010b0-4fac-4317-a809-f1743712248c" />

2)Course Creation&Manage Section
<img width="891" height="800" alt="{04CDE6DE-EA4E-42AE-ADDA-B0E3B9A2371C}" src="https://github.com/user-attachments/assets/c12bc038-adbd-4a11-86f3-e5098af3549d" />








---

## Author

**Nirav Mathukiya**
[GitHub](https://github.com/nirav-dev-04) · [LinkedIn](https://linkedin.com/in/nirav-mathukiya-47b1752b3)

---

## License

This project is for educational and portfolio purposes.
