# Super Friends — Cricket Scoring PWA

A premium, installable cricket scoring app: live matches, tournaments,
teams, player profiles, and a full ball-by-ball admin scoring console.
Built in plain HTML5 / CSS3 / ES6 — no build step, no framework.

## Run it locally

You need a static server (not `file://`, because the service worker and
`fetch` calls require `http`):

```bash
cd superfriends
python3 -m http.server 8080
# open http://localhost:8080
```

Or with Node: `npx serve .`

Open it on your phone (same Wi-Fi, use your computer's LAN IP) and use
"Add to Home Screen" — it installs like a native app on both Android and
iPhone.

## What's fully working right now (no setup required)

- Home: live matches, upcoming, recent results, tournament cards, featured
  players, quick actions.
- Live Score screen: score hero, run rate / required run rate, status
  banner, innings selector, this-over ball timeline, partnership, batting
  & bowling tables, fall of wickets, extras, yet-to-bat, win-probability
  bar, match summary.
- Admin panel: create tournaments, teams, players; schedule matches; run
  the toss; full ball-by-ball scoring (runs, wide, no-ball, bye, leg bye,
  wicket with dismissal type, new batsman/bowler prompts, strike
  rotation, over completion); undo last ball; manual score edit; end
  innings (auto-carries the target into a 2nd-innings setup form); finish
  match.
- Tournament: points table, fixtures & results, knockout bracket, Orange
  Cap, Purple Cap, most sixes/fours, MVP leaderboard.
- Team page: logo, captain, playing XI, full squad, team stats.
- Player profile: avatar, career stats, a hand-drawn performance graph
  (no external chart library), awards.
- Dark/light theme toggle (persisted).
- PWA: installable, offline app-shell caching via service worker, app
  icons generated for you.
- Local notifications: wickets and sixes trigger a browser notification
  once you grant permission (see limits below).

All of this runs today on a `localStorage`-backed data layer — open the
app on one device and every feature works with zero configuration.

## Wiring up real Firebase (for cross-device real-time sync)

Everything reads/writes through the single `DB` object in `js/db.js`, so
switching backends touches one file:

1. Create a Firebase project → enable **Realtime Database** and
   **Authentication** (email/password or Google sign-in).
2. Copy your web app config.
3. Open `js/db.js`, paste it into `FIREBASE_CONFIG`, and set
   `USE_FIREBASE = true`.
4. Uncomment the Firebase SDK `<script type="module">` block near the
   top of `index.html`.
5. Replace the body of each `DB` method with the equivalent
   `set()` / `onValue()` / `push()` call against `window.__firebaseDb`
   (the shape of the data — `players`, `teams`, `tournaments`,
   `matches` — is already Realtime-Database-friendly; the seed objects
   in `db.js` double as your schema reference).
6. Deploy with **Firebase Hosting**: `firebase init hosting` (point it at
   this folder), then `firebase deploy`.

I left this as a manual step rather than a fake config because a
`firebaseConfig` with placeholder keys would just fail silently or throw
— that's a worse experience than a clearly-labeled local mode that
actually works.

## Push notifications — current limits

The service worker (`sw.js`) already has a `push` event handler ready to
show system notifications. What's **not** included: a server that sends
those pushes. Real push (not just local, in-tab notifications) needs:

- VAPID keys generated from your Firebase project (Cloud Messaging).
- A server endpoint (e.g. a Firebase Cloud Function) that calls the FCM
  API when a wicket/six/match-end happens.

Today, `notifyEvent()` in `js/app.js` fires a **local** notification
directly from the browser tab that's actively scoring — great for the
scorer's own device, not yet a cross-device push. Wiring the Cloud
Function is a small, separate task once your Firebase project exists.

## Authentication / roles

The Admin panel is currently open to anyone who opens `#/admin` — there's
no login gate yet. Firebase Authentication is the natural fit (email/pw
or Google sign-in), gating the Admin routes behind `onAuthStateChanged`
and Realtime Database security rules (e.g. only signed-in "scorer" role
can write to `/matches/*`). I didn't fabricate a login screen backed by
nothing, since that would look functional without being secure.

## File structure

```
superfriends/
├── index.html          # app shell, nav, PWA meta tags
├── manifest.json        # PWA manifest
├── sw.js                 # service worker (offline cache + push hook)
├── css/styles.css        # design tokens (light/dark), all components
├── js/db.js              # data layer — localStorage now, Firebase-ready
├── js/app.js              # router, Home/Team/Player/Tournament screens
├── js/scoring.js           # ball-by-ball engine, Live Score, Admin panel
└── icons/                   # generated app icons (192, 512, apple-touch)
```

## Design notes

Theme: "floodlights at night" — deep indigo/navy dark mode, soft glass
cards, a violet→teal gradient signature, coral for live/wicket states,
gold for caps & awards. Type: Sora (display) + Inter (body). The
signature visual element is the ball-by-ball timeline rendered as small
colored discs, plus the win-probability bar on both the home live-card
and the live score screen.
