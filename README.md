

# Movie Memory — SWE Take-Home Exercise (Full-Stack) for Scowtt

Movie Memory is a small Next.js app that authenticates with Google, collects a user’s favorite movie, and generates “fun facts” using the OpenAI API. Facts are stored in Postgres and served with correctness guarantees (60s caching + burst/idempotency protection).

## Tech Stack
- TypeScript
- Next.js (App Router) + React + TailwindCSS
- Postgres (Docker)
- Prisma
- NextAuth (Google OAuth)
- OpenAI API

---


### 1) Clone and install
bash
git clone https://github.com/RishabhKaly/Movie-Memory.git
cd Movie-Memory
---
### 2) Install dependecies
npm install

---
### 3) Create environment variables:
touch .env


