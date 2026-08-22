# Training

Phone-first training log for Vidar. Today’s session, set-by-set weights, previous loads, how you felt, and progress.

Bookmark `/go/huge-arms` on your phone, or type the passphrase once. After that an httpOnly cookie keeps the session. The passphrase, salt, and Firebase Admin key never ship to the browser.

## Weekly plan

| Day | Session |
| --- | --- |
| Mon | Push · chest, shoulders, triceps |
| Tue | Pull · back, rear delts, biceps |
| Wed | Legs · second workout |
| Thu | Arms · Get Huge Arms day |
| Fri | Shoulders + arm pump |
| Sat | Optional walk + mobility |
| Sun | Rest |

The schedule lives in `src/data/program.ts`.

## Security

- `ACCESS_PASSPHRASE`, `ATHLETE_SALT`, `SESSION_SECRET`, and `FIREBASE_SERVICE_ACCOUNT` are server-only.
- Firestore rules deny every client read and write.
- The Admin SDK writes only the single athlete document and **today’s** session.
- Unlock attempts are rate-limited. Deletes are not exposed.

I've set up prototype Security Rules to keep the data in Firestore safe. They are designed to be secure because the client SDK is locked out entirely and the server accepts writes only after a signed session cookie. However, you should review and verify them before broadly sharing your app. If you'd like, I can help you harden these rules.

## Run locally

```bash
npm install
# place Admin credentials at .secrets/firebase-admin.json
cp .env.example .env.local
npm run dev
```

Open [http://127.0.0.1:43173](http://127.0.0.1:43173).

## Vercel

Live site: https://training-eight-fawn.vercel.app

Project: `training` under vidarsoders-projects. Production and Preview hold `ACCESS_PASSPHRASE`, `ATHLETE_SALT`, `SESSION_SECRET`, and `FIREBASE_SERVICE_ACCOUNT` as Sensitive secrets. Do not add `NEXT_PUBLIC_` copies of those values.
