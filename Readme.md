# PrepTracker — College Placement Preparation Tracker

A full-stack MERN application that helps engineering students track and improve their campus placement readiness — resume quality, skill gaps, mock test performance, and certifications — all in one dashboard, with an admin panel for placement coordinators to monitor an entire batch.

## Why I built this

Most placement prep happens across scattered spreadsheets, WhatsApp groups, and one-off PDF resume checkers. PrepTracker centralizes it: a student uploads a resume and gets AI-generated ATS feedback, takes AI-generated mock tests by subject, tracks certifications, and sees one "readiness score" that combines all of it — while admins get a live leaderboard and CSV export across the whole cohort.

## Features

**For students**
- **Auth** — email/password signup with role-aware login (student vs. admin portals), bcrypt password hashing, and a secure forgot/reset-password flow using hashed, time-limited reset tokens.
- **Resume Analyzer** — upload a PDF resume; it's parsed server-side and scored by an LLM for ATS-friendliness, with strengths, gaps, missing keywords, and suggested action verbs. Full history of past uploads is kept.
- **Skill Gap Analysis** — log your current skills and get an AI breakdown of what's missing for your target companies, with a "how to learn it" explainer per gap.
- **AI Practice Tests** — generate on-demand multiple-choice tests (Aptitude, Coding, Verbal, Quant, DSA) at Easy/Medium/Hard difficulty, get scored, and receive topic-level strengths/weaknesses feedback. Rate-limited to prevent abuse of the AI quota.
- **Test Score Tracking** — running averages per subject, with a benchmark view against peers.
- **Certifications** — add, edit, and track completion status of external certifications.
- **Activity Feed** — a running log of account actions (logins, submissions, resume uploads, etc.).
- **Profile management** — editable profile with avatar upload (Cloudinary-backed).

**For admins**
- Cohort-wide dashboard: aggregate stats, per-student readiness breakdown, and a leaderboard.
- CSV export of all student data for offline reporting.
- Automated congratulations email trigger on placement status update.

## Tech Stack

**Frontend**
- React 18 + Vite
- React Router
- Tailwind CSS
- Recharts (score/progress visualizations)
- react-hot-toast (notifications)

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication, bcrypt password hashing
- Zod for request validation
- Helmet + express-rate-limit for security hardening
- Multer + Cloudinary for file/avatar uploads
- Nodemailer for transactional email (welcome, password reset, placement congrats)
- Groq (Llama 3.3 70B) for AI-generated resume feedback, study plans, skill-gap explanations, and practice test generation/evaluation

## Architecture

The backend follows a layered structure rather than putting logic directly in routes:

```
routes → validators (Zod) → controllers → services → models
```

- **Routes** wire up endpoints and middleware only.
- **Validators** reject malformed requests before they hit business logic.
- **Controllers** handle the HTTP layer (status codes, response shape).
- **Services** hold reusable business logic (AI calls, email sending, stat calculations) so controllers stay thin.
- **Models** define Mongoose schemas.
- A centralized error-handling middleware catches and formats all thrown errors consistently.

Every protected route runs through JWT auth middleware, and resource-level ownership is checked in the controller (e.g. a user can only fetch or submit their own practice sessions) — role-gated admin routes run through a second `isAdmin` middleware layer.

## Project Structure

```
placementTracker/
├── client/                  # React frontend
│   └── src/
│       ├── pages/           # Route-level views (Dashboard, Profile, PracticeTest, etc.)
│       ├── components/      # Shared UI (Navbar, StatCard, Toast, route guards...)
│       ├── context/         # AuthContext (session, login/register/logout)
│       └── lib/api.js       # Fetch wrapper with auth header injection + 401 handling
└── server/                  # Express backend
    └── src/
        ├── controllers/     # Request handlers per resource
        ├── routes/          # Express routers
        ├── models/          # Mongoose schemas
        ├── services/        # AI, email, stats logic
        ├── middleware/      # Auth, admin-guard, validation, error handling
        ├── validators/      # Zod schemas
        └── config/          # DB, Cloudinary, email, AI client setup
```

## API Overview

All routes are prefixed with `/api/v1`.

| Resource | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/forgot-password`, `POST /auth/reset-password/:token` |
| Profile | `GET /profile`, `PUT /profile`, avatar upload/delete |
| Resume | resume upload, `GET /resume/history`, `GET /resume/latest` |
| Skills | `GET /skills`, `POST /skills`, `DELETE /skills/:id`, `GET /skills/gap-analysis` |
| Certifications | `GET /certifications`, `POST /certifications`, `PUT /certifications/:id`, `DELETE /certifications/:id` |
| Test Scores | `GET /tests`, `GET /tests/history/:subject`, `GET /tests/benchmark` |
| Practice Tests | `POST /practice/start`, `GET /practice/:sessionId`, `POST /practice/:sessionId/submit`, `GET /practice/history` |
| AI | resume analysis, study plan, skill-gap explanation, interview questions, answer evaluation |
| Activity | `GET /activity` |
| Admin | `GET /admin/stats`, `GET /admin/leaderboard`, `GET /admin/export/csv`, `GET /admin/students`, `GET /admin/students/:id`, student update |

## Getting Started

### Prerequisites
- Node.js ≥ 20
- A MongoDB connection string (Atlas or local)
- A Gemini API key (for AI features)
- A Cloudinary account (for uploads)
- SMTP credentials (for transactional email)

### Setup

```bash
# Clone the repo
git clone <your-repo-url>
cd placementTracker

# Backend
cd server
npm install
cp .env.example .env   
npm run dev

# Frontend (in a new terminal)
cd client
npm install
npm run dev
```

The client expects the API at `VITE_API_URL` (defaults to `http://localhost:5000/api/v1`); the server expects `FRONTEND_URL` for CORS (defaults to `http://localhost:5173`).

### Environment Variables

Create `server/.env` with:

```
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=a_long_random_secret
JWT_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

GROQ_API_KEY=

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=
```

