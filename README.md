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

Live project: **vidar-training** (Europe `eur3`). The web app is already registered and the client config is baked into `src/lib/firebase.ts`.

Document layout (few reads on purpose):

- `athletes/{sha256(passphrase + salt)}` — profile, PRs, last loads per day, last 12 session summaries
- `athletes/{id}/sessions/{yyyy-mm-dd}` — the actual sets

On open: **one** athlete read. Today’s session is read only if that document says a session is already open today. No collection scans, no live listeners. Writes are debounced.

Console: https://console.firebase.google.com/project/vidar-training/overview

Deploy rules from this repo:

```bash
npx -y firebase-tools@latest deploy --only firestore
```
