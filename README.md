# Verifab

A peer-reviewed skill verification platform. Users claim skills, complete challenges, submit proof, and receive verified credentials after community review.

## Features

- **Skill Claims** - Claim skills and receive cryptographic challenges to prove expertise
- **Proof Submission** - Submit proof files with SHA-256 hashing and timestamp anchoring
- **Peer Review** - Community members review and approve/reject skill claims
- **Credentials** - Verified credentials issued after 3 approvals, with public verification
- **Reputation System** - Reviewer reputation based on approval count

## Tech Stack

**Backend:** Node.js, Express, SQLite (sql.js), JWT auth, bcrypt
**Frontend:** React 19, Vite 8, oxlint

## Getting Started

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Run backend (port 3001)
cd backend && npm run dev

# Run frontend (port 5173)
cd frontend && npm run dev
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Backend server port |
| `JWT_SECRET` | `verifab-dev-secret-change-in-production` | JWT signing secret |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |

## API Endpoints

### Auth
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Skills
- `GET /api/skills/categories` - List skill categories
- `GET /api/skills/challenges/:category` - Get challenge for category
- `POST /api/skills/claim` - Claim a skill
- `POST /api/skills/submit-proof` - Submit proof for a claim
- `GET /api/skills/my-claims` - List user's claims
- `GET /api/skills/:id` - Get claim details

### Reviews
- `GET /api/reviews/pending` - List pending reviews
- `POST /api/reviews/submit` - Submit a review
- `GET /api/reviews/my-reviews` - List user's reviews

### Credentials
- `GET /api/credentials/my` - List user's credentials
- `GET /api/credentials/verify/:hash` - Verify a credential (public)
