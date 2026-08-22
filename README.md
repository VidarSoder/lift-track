# Training

Phone-first training log for Vidar. Today’s session, set-by-set weights, previous loads, how you felt, and progress.

**Form** is the preview book: still photos and last-used kg on the list. Tap a row for the GIF on that page, then Back. A short YouTube link is there if you want it. After you log a lift once, that weight comes back the next time. The bottom bar sits in the page chrome so Chrome on a phone cannot leave it floating. An in-progress session has a Back to session strip above the nav.

Bookmark `/go/huge-arms` on your phone, or type the passphrase once. After that an httpOnly cookie keeps the session. The passphrase, salt, and Firebase Admin key never ship to the browser.

**Settings** holds body-weight weigh-ins over time and the program start date. They save on the same athlete document.

Pull down from the top of any page to refresh. Cancel an open session if you want out — save the kg (default) or remove it. Finish always saves.

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
