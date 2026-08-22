# Training

Phone-first training log for Vidar. It follows a weekly **Get Huge Arms** specialization plus the second (legs / compounds) workout: today’s session, set-by-set weights, previous loads, how you felt, and progress — without a login wall.

Bookmark `/go/huge-arms` on your phone (or Share → Add to Home Screen). After the first unlock the passphrase stays on the device.

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

The schedule lives in `src/data/program.ts`. The three source PDFs were not available in this workspace, so the days are encoded from the Get Huge Arms / second-workout structure. Paste the exact sheets later and we can lock every set to the paper.

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43173](http://127.0.0.1:43173) and enter `huge-arms`, or go straight to `/go/huge-arms`.

## Vercel

This is a standard Next.js app. Import the Git repo in Vercel (Stockholm `arn1` is set in `vercel.json`). Add the same env vars as `.env.example`.

Change the passphrase with `NEXT_PUBLIC_ACCESS_PASSPHRASE` and bookmark `/go/<that-word>`.

## Firebase

The app writes to Firestore only when the `NEXT_PUBLIC_FIREBASE_*` keys are set. Until then everything is saved on the phone.

Document layout (few reads on purpose):

- `athletes/{sha256(passphrase + salt)}` — profile, PRs, last loads per day, last 12 session summaries
- `athletes/{id}/sessions/{yyyy-mm-dd}` — the actual sets

On open: **one** athlete read. Today’s session is read only if that document says a session is already open today. No collection scans, no live listeners. Writes are debounced.

Deploy rules from this repo:

```bash
npx -y firebase-tools@latest deploy --only firestore:rules
```

I've set up prototype Security Rules to keep the data in Firestore safe. They are designed to be secure for a single private passphrase vault (document IDs are 64-char SHA-256 hex, session IDs must be dates, athlete/session payloads are type-checked, deletes are denied). However, you should review and verify them before broadly sharing your app. If you'd like, I can help you harden these rules.

## Firebase login (this machine)

Firebase MCP was not signed in when the app was built. If you want the agent to attach your existing project, visit the Firebase login URL it sent, confirm the session ID, and paste the auth code.
