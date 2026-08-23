# Lift Track

A phone-first workout log built with Next.js. Log sets, track body weight, preview exercise form, and review progress — optimized for one-handed use on a phone.

**Live:** https://training-eight-fawn.vercel.app

## What it does

- **Today** — see the planned session and jump into a workout
- **Form** — searchable exercise library with photos and last-used weights (Swedish + English search)
- **Lift** — set-by-set logging with warm-ups, timers, and cardio warm-up options
- **Progress** — session history, lift trends, body weight chart, PRs
- **Settings** — body-weight weigh-ins (with optional BMI details) and program start date

## Tech stack

- Next.js (App Router) · TypeScript · Tailwind
- Firebase Firestore (Admin SDK on the server only)
- Deployed on Vercel

## Security

This repo is public. **No secrets are committed.**

| Layer | How it works |
| --- | --- |
| **Firestore** | Rules deny all client reads and writes. Data is only accessed through the server Admin SDK. |
| **API** | Origin-locked; requires an httpOnly session cookie after passphrase unlock. |
| **Secrets** | `ACCESS_PASSPHRASE`, `ATHLETE_SALT`, `SESSION_SECRET`, and `FIREBASE_SERVICE_ACCOUNT` live in Vercel environment variables only — never in the browser or this repo. |
| **Writes** | Server validates every payload (typed checks, size limits, date formats) before writing to Firestore. |

## Deploy

Pushes to `main` on GitHub trigger a production deploy via a Vercel deploy hook (see `.github/workflows/deploy.yml`).

Required GitHub secret: `VERCEL_DEPLOY_HOOK` (set in repo Settings → Secrets).

## Run locally

```bash
npm install
cp .env.example .env.local
# Fill .env.local from Vercel env pull, or use .secrets/firebase-admin.json locally
npm run dev
```

Open http://127.0.0.1:43173

## License

Private use. All rights reserved.
