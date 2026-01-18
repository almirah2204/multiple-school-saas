# School Management SaaS (Multi-school)

This repo contains a minimal-but-working scaffold for a multi-school School Management SaaS:
- Backend: Node.js + Express (APIs, JWT, Stripe webhook)
- Frontend: Next.js + Tailwind CSS
- Database: PostgreSQL (Supabase-compatible)

Important: This is a scaffold intended as a production-ready starting point — you'll want to harden, add complete validation, tests, logging, rate-limiting, and CI/CD.

## Local setup

Prerequisites:
- Node 18+
- PostgreSQL (or Supabase)
- Stripe account for test keys

1) Setup Postgres (Supabase)
- Create database and connection string
- Run SQL schema (backend/sql/schema.sql) against your database to create tables and seed plans

Example with psql:
psql $DATABASE_URL -f backend/sql/schema.sql

2) Backend
- cd backend
- cp .env.example .env and fill in values (DATABASE_URL, JWT_SECRET, STRIPE keys, FRONTEND_URL)
- npm install
- npm run dev

Backend will run on http://localhost:4000

3) Frontend
- cd frontend
- cp .env.local.example .env.local and set NEXT_PUBLIC_API_URL=http://localhost:4000 and NEXT_PUBLIC_STRIPE_PK
- npm install
- npm run dev

Open http://localhost:3000

## Deployment

Frontend: Vercel
- Set environment variables in Vercel: NEXT_PUBLIC_API_URL -> backend URL
- Deploy the frontend folder

Backend: Render (or Heroku)
- Service type: Web Service
- Build command: npm install && npm run build (not required) — start with npm start
- Start command: npm start or use dev for testing
- Environment variables: DATABASE_URL, JWT_SECRET, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, FRONTEND_URL, PORT

Stripe:
- Create Prices and Products for your Basic/Pro plans; add the Stripe Price ID to the `plans.stripe_price_id` or map slugs to Price IDs in your own mapping.

## Environment variables

Backend (.env)
- DATABASE_URL - Postgres connection (Supabase)
- JWT_SECRET - secret for signing tokens
- JWT_EXPIRES_IN - token expiry (optional)
- STRIPE_SECRET_KEY - Stripe secret key
- STRIPE_WEBHOOK_SECRET - Stripe webhook signing secret
- FRONTEND_URL - URL of frontend for redirects
- PORT - optional

Frontend (.env.local)
- NEXT_PUBLIC_API_URL - backend API base URL
- NEXT_PUBLIC_STRIPE_PK - Stripe publishable key

## Notes & next steps (recommended)
- Add stricter validation, input sanitation and rate limits.
- Add role-management UI in frontend for Super Admin to assign roles and manage schools.
- Add unit & integration tests.
- Add pagination and search on APIs.
- Improve multi-tenancy: consider row-level security (RLS) if using Supabase.
- Add email sending for verification and password reset.
- Add file uploads (student photos) via S3 or Supabase Storage.
