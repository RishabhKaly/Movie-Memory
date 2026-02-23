# Movie Memory — SWE Take-Home Exercise (Full-Stack) for Scowtt

Movie Memory is a small Next.js application that authenticates with Google, collects a user’s favorite movie, and generates “fun facts” using the OpenAI API. Facts are stored in Postgres and served with correctness guarantees (60s caching + burst/idempotency protection).


## Tech Stack
- TypeScript
- Next.js (App Router) + React + TailwindCSS
- Postgres (Docker)
- Prisma
- NextAuth (Google OAuth)
- OpenAI API

---
## Setup Instructions

### 1) Clone Repo
```bash
git clone https://github.com/RishabhKaly/Movie-Memory.git
cd Movie-Memory

```
---

### 2) Install dependecies
```bash
npm install
```
---
### 3) Create environment variables:
```bash
touch .env
```
Add the following variables to your .env file:
```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

DATABASE_URL=postgresql://postgres:postgres@localhost:5433/moviememory?schema=public

OPENAI_API_KEY=your_openai_api_key
```
---
##  ****IMPORTANT** **

If you do not have a Google client id follow these steps:
### 1) Create a Google Cloud Project 

1) Go to: https://console.cloud.google.com/

2) Click “Select Project” (top left)

3) Click “New Project”

4) Give it a name (e.g., MovieMemory)

5) Click Create

### 2) Enable Google OAuth API
1) In the left sidebar, 

   go to:
APIs & Services → Library

2) Search for:
   
   Google Identity Services

3) Click it and press Enable

### 3) Configure OAuth Consent Screen
1) Go to:
   
   APIs & Services → OAuth consent screen

2) Choose:
  
   External

3) Fill in:

   App name: Movie Memory

   User support email: your email

   Add your email as a test user

   Save and continue through all steps

   You do NOT need to publish the app for local testing.

### 4) Create OAuth Credentials


1) Go to:

   APIs & Services → Credentials

2) Click:

   Create Credentials → OAuth Client ID

3) Choose:

   Web Application

4) Add these values:

    Authorized JavaScript origins:
http://localhost:3000

    Authorized redirect URIs:
http://localhost:3000/api/auth/callback/google

5) Click Create

### 5) Add credentials to .env file
1) You will receive:

    Client ID

    Client Secret

2) Add them to your .env:
```bash
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```
---
##  ****IMPORTANT** **

If you do not have an OpenAI API key follow these steps:
### 1) Create OpenAI Account

1) Go to:
   https://platform.openai.com/
   
   Sign in or create an account.

### 2) Generate an OpenAI API key
1) Go to:
    API Keys

2) Click:
Create new secret key

3) Copy the key (it will only show once)

### 3) Add OpenAI API key to .env file
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### Note: if you do not have OpenAI credits the fact generator will not work.
---
### 4) Start the Database
This project uses Postgres via Docker.

If you do not have Docker installed on your device you can do so here:
https://www.docker.com/products/docker-desktop/

Make sure Docker Desktop is installed and running on your device.

Then run:
```bash
docker compose up -d
```
This will start a Postgres container on port 5433.

To confirm it's running:
```bash
docker ps
```
---
### 5) Run Database Migrations
Generate Prisma client and apply migrations:
```bash
npx prisma generate
npx prisma migrate dev
```
Optional: Inspect the database:
```bash
npx prisma studio
```
---
### 6) Start the Development Server
```
npm run dev
```
visit:
```
http://localhost:3000
```
Sign in with Google and follow onboarding.

---
### 7) (Optional) Run Tests
to run backend tests:
```
npm run test:run
```

---


## Architecture Overview

 1. **System Overview**

    Movie Memory is a full-stack Next.js application that authenticates users via Google OAuth, stores user preferences in Postgres, and generates fun movie facts using the OpenAI API.

    The system is designed around three core principles:

    *   Correctness under concurrency

    *    Clear separation of responsibilities

    *    Graceful failure handling

     The application consists of:

    *    Frontend (Next.js + React + TailwindCSS)

    *    Backend API routes (App Router)

    *   Postgres database (via Prisma ORM)

    *   External services (Google OAuth + OpenAI API)
---

2. **Authentication Flow**

    Authentication is handled using NextAuth with the Prisma adapter.

    **Flow:**

    1. User signs in via Google OAuth.

    2. Google returns profile information (email, name, image).

    3. NextAuth persists the user in Postgres.

    4. A session is created and stored in the Session table.

    5. Protected routes use getServerSession to validate authentication.

    **Security properties:**

    * No userId is ever trusted from client input.

    * All user scoping is derived from server-side session data.

    * Unauthorized access returns HTTP 401.
---
3.  **Data Model**
    
    *User Model*

    Stores:

    * Google identity (email, name, image)

    * Application-specific field: `favoriteMovie`

    * Relationship to `Fact`

    **Fact Model**

    Stores:

    * Generated fact content

    * `userId` (foreign key)

    * `windowStart` (minute bucket for caching)

    * `createdAt`

    **Important Constraint**
    ```
    @@unique([userId, windowStart])
    ```
    This enforces:

    * At most one fact per user per 60-second window.

    * Concurrency-safe idempotency at the database level.

    This decision eliminates race conditions without relying on in-memory locks.
---
4. **Fact Generation Architecture (Variant A)**

    Fact generation happens in `/api/fact.`

    The flow:

    1. Validate authenticated session.

    2. Fetch user from DB.

    3. Compute:
     ```
     windowStart = floor(current time to nearest minute)
    ```
    4.  Check if a fact already exists for (userId, windowStart).


    **If exists:**

    * Return cached fact.

    * No OpenAI call.

    **If not:**

    * Generate fact via OpenAI.

    * Store fact with windowStart.

    * Return new fact.
---
5. **60-Second Cache Window**

    Rather than comparing timestamps directly, the system uses a deterministic time bucket:
    ```
    Math.floor(Date.now() / 60000) * 60000
    ```

    This creates a minute-aligned window.

    Benefits:

    Simpler logic

    * Easy uniqueness constraint

    * DB-enforceable correctness

    * No timing edge cases

    Tradeoff:

    * Cache resets at minute boundaries rather than exactly 60 seconds since last request.
---

6. **Burst / Idempotency Protection**

    If multiple requests occur simultaneously (e.g. multiple tabs):

    * All compute the same `windowStart`.

    * Only one insert succeeds.

    * Others hit a unique constraint violation.

    * The handler catches the conflict and returns the stored fact.

    This ensures:

    * No duplicate OpenAI calls

    * No inconsistent data

    * Safe concurrency behavior

    The idempotency guarantee is enforced at the database level, not application memory, making it scalable across multiple server instances.

---
7. **Failure Handling Strategy**

    If OpenAI fails:

    1. Attempt to return the most recent cached fact.

    2. If none exists, return a user-friendly 503 response.

    This provides graceful degradation and prevents total feature failure.

---

8. **Authorization Model**

    All fact operations are scoped by userId derived from session.

    There is no API that accepts a userId from the client.

    Backend tests verify:

    * 60-second caching behavior

    * User isolation (user B cannot access user A facts)

---

9. **Separation of Concerns**


    * Prisma handles database abstraction.

    * UI is responsible only for rendering state and triggering API calls.

    This keeps backend logic testable and modular.

---

10. **Design Philosophy**

    The architecture prioritizes:

    * Deterministic behavior/outcomes
    * Database-enforced guarantees
    * Simple logic
    * Minimal but meaningful test coverage
---
## Variant Reasoning (Variant A)

Originally I was thinking of choosing Variant B since I had experience from my prior personal projects working with the Frontend and implementing API endpoints and client-side caching but I ended up choosing Variant A because I had never implemented Burst/ Idempotency protection and wanted to learn more about it. Variant A also stood out to me because of its deterministic behavior by emphasizing backend correctness.

---
## Key Trade Offs
1. **Deterministic Time Bucketing vs Sliding Window**

    I implemented caching using a deterministic minute-aligned window:

    ```
    windowStart = floor(current time to nearest minute)
    ```
    Benefits:

    * Simpler uniqueness constraint

    * Database-enforced idempotency



    Tradeoff:

    * Cache resets at minute boundaries instead of exactly 60 seconds after last generation.

    I chose deterministic bucketing because it simplifies correctness
    

2. **Database-Enforced Idempotency vs In-Memory Locking**

    I used a composite unique constraint:
    ```
    @@unique([userId, windowStart])
    ```
    Benefits:

    * Works across multiple server instances

    * Safe under concurrent requests

    * No reliance on process memory

    Tradeoffs:

    * Slightly more schema complexity

    * Requires handling unique constraint errors in application logic

    This approach scales better than an in-memory lock, which would fail in multi-instance deployments.

3. **On-Demand Fact Generation**

    Facts are generated only when requested.

    Benefits:

    * Minimal unnecessary OpenAI calls

    *Simple model

    Tradeoffs:

    * No background pre-generation

    * Slight delay during generation

    For this take home assignment I emphasized clarity and correctness rather than overengineering features.

---
## What I would Improve in 2 more Hours
1. **API Rate Limiting**

    * Add per-user rate limiting fact generation

    * Prevent excessive API calls beyond caching window

2. **Improve UI/UX**
    * Improve dashboard & onboarding page to make it less "minimalistic"
    * Disable Generate Fact button while currently generating a Fact


---

## AI Usage

AI tools were used as an assistant during development.

* Used AI to clarify Prisma migration errors and schema issues.

* Used AI to reason and assist through concurrency and idempotency strategies.

* Used AI to debug TypeScript and NextAuth configuration issues.

* Used AI to assist with testing.


---







