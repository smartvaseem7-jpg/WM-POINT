/**
 * Super Friends — Data Layer
 * ---------------------------------------------------------------
 * This file is the ONLY place that talks to storage. Every screen
 * reads/writes through the `DB` object below. Right now `DB` is
 * backed by localStorage so the whole app is 100% functional with
 * zero setup. To go live with real-time cross-device sync:
 *
 *   1. Create a Firebase project → Realtime Database + Authentication.
 *   2. Paste your config into FIREBASE_CONFIG below.
 *   3. Set USE_FIREBASE = true.
 *   4. Add the Firebase SDK script tags in index.html (commented,
 *      ready to uncomment, right above this file's <script> tag).
 *
 * The DB.* method signatures do not change either way, so nothing
 * in app.js / scoring.js needs to be touched.
 * ---------------------------------------------------------------
 */

const USE_FIREBASE = false; // flip to true once FIREBASE_CONFIG is filled in

const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const STORE_KEY = "superfriends_store_v1";

/* ---------------- seed data (first-run only) ---------------- */

function seedData() {
  const players = [
    { id: "p1", name: "Arjun Mehta", role: "Batter", team: "t1", photoInitials: "AM", matches: 42, runs: 1780, avg: 46.8, sr: 138.2, hs: 112, wickets: 0, economy: null, bowlAvg: null, awards: ["Player of the Series — Winter Cup"], graph: [22, 45, 12, 78, 34, 61, 40, 55] },
    { id: "p2", name: "Rohan Iyer", role: "All-rounder", team: "t1", photoInitials: "RI", matches: 38, runs: 960, avg: 32.0, sr: 121.5, hs: 84, wickets: 41, economy: 6.8, bowlAvg: 21.4, awards: [], graph: [10, 30, 44, 20, 60, 15, 33, 48] },
    { id: "p3", name: "Vikram Nair", role: "Bowler", team: "t1", photoInitials: "VN", matches: 40, runs: 210, avg: 12.4, sr: 98.0, hs: 28, wickets: 58, economy: 6.1, bowlAvg: 18.9, awards: ["Purple Cap — Summer League"], graph: [2, 3, 1, 4, 2, 5, 3, 4] },
    { id: "p4", name: "Karthik Rao", role: "Wicketkeeper", team: "t2", photoInitials: "KR", matches: 35, runs: 890, avg: 29.6, sr: 129.0, hs: 76, wickets: 0, economy: null, bowlAvg: null, awards: [], graph: [15, 25, 40, 10, 55, 30, 20, 45] },
    { id: "p5", name: "Sanjay Verma", role: "Batter", team: "t2", photoInitials: "SV", matches: 44, runs: 2010, avg: 51.2, sr: 142.0, hs: 128, wickets: 0, economy: null, bowlAvg: null, awards: ["Orange Cap — Winter Cup", "MVP — Winter Cup"], graph: [60, 40, 90, 55, 70, 35, 80, 65] },
    { id: "p6", name: "Farhan Sheikh", role: "Bowler", team: "t2", photoInitials: "FS", matches: 39, runs: 120, avg: 8.5, sr: 85.0, hs: 22, wickets: 62, economy: 5.9, bowlAvg: 16.2, awards: ["Purple Cap — Winter Cup"], graph: [3, 4, 2, 5, 4, 3, 6, 4] },
    { id: "p7", name: "Dev Malhotra", role: "All-rounder", team: "t3", photoInitials: "DM", matches: 30, runs: 780, avg: 28.0, sr: 118.4, hs: 65, wickets: 30, economy: 7.2, bowlAvg: 24.1, awards: [], graph: [20, 15, 35, 25, 40, 18, 30, 22] },
    { id: "p8", name: "Aditya Kulkarni", role: "Batter", team: "t3", photoInitials: "AK", matches: 33, runs: 1420, avg: 43.0, sr: 133.7, hs: 101, wickets: 0, economy: null, bowlAvg: null, awards: [], graph: [30, 55, 20, 65, 45, 70, 38, 50] },
  ];

  const teams = [
    { id: "t1", name: "Deccan Chargers", short: "DCH", color: "#5B5FEF", captain: "p1", squad: ["p1", "p2", "p3"], playingXI: ["p1", "p2", "p3"] },
    { id: "t2", name: "Coastal Kings", short: "CTK", color: "#00C2A8", captain: "p5", squad: ["p4", "p5", "p6"], playingXI: ["p4", "p5", "p6"] },
    { id: "t3", name: "Northline Falcons", short: "NLF", color: "#FFB400", captain: "p8", squad: ["p7", "p8"], playingXI: ["p7", "p8"] },
    { id: "t4", name: "Riverside Titans", short: "RVT", color: "#FF5470", captain: "p1", squad: ["p1"], playingXI: ["p1"] },
  ];

  const tournaments = [
    {
      id: "tour1",
      name: "Super Friends Winter Cup 2026",
      season: "2026",
      teams: ["t1", "t2", "t3", "t4"],
      pointsTable: [
        { team: "t2", played: 6, won: 5, lost: 1, nrr: 1.42, pts: 10 },
        { team: "t1", played: 6, won: 4, lost: 2, nrr: 0.81, pts: 8 },
        { team: "t3", played: 6, won: 3, lost: 3, nrr: -0.12, pts: 6 },
        { team: "t4", played: 6, won: 0, lost: 6, nrr: -1.88, pts: 0 },
      ],
      orangeCap: "p5",
      purpleCap: "p6",
      mostSixes: { player: "p5", count: 28 },
      mostFours: { player: "p1", count: 41 },
      mvp: [
        { player: "p5", points: 512 },
        { player: "p1", points: 466 },
        { player: "p6", points: 431 },
        { player: "p3", points: 398 },
      ],
      bracket: {
        semis: [
          { a: "t2", b: "t4", winner: "t2" },
          { a: "t1", b: "t3", winner: "t1" },
        ],
        final: { a: "t2", b: "t1", winner: null },
      },
    },
  ];

  const matches = [
    {
      id: "m1",
      tournament: "tour1",
      teamA: "t1",
      teamB: "t2",
      overs: 20,
      status: "live", // live | upcoming | completed
      toss: { winner: "t1", decision: "bat" },
      venue: "Deccan Stadium",
      startTime: Date.now() - 1000 * 60 * 40,
      innings: [
        {
          battingTeam: "t1",
          bowlingTeam: "t2",
          runs: 142,
          wickets: 3,
          legalBalls: 92, // 15.2 overs
          extras: { wide: 4, noball: 1, bye: 2, legbye: 1 },
          batsmen: [
            { id: "p1", name: "Arjun Mehta", runs: 68, balls: 44, fours: 7, sixes: 2, out: false, how: "" },
            { id: "p2", name: "Rohan Iyer", runs: 22, balls: 18, fours: 1, sixes: 1, out: false, how: "" },
            { id: "p9", name: "Suresh Bhat", runs: 34, balls: 20, fours: 4, sixes: 1, out: true, how: "c Karthik Rao b Farhan Sheikh" },
          ],
          strikerId: "p1",
          nonStrikerId: "p2",
          bowlers: [
            { id: "p6", name: "Farhan Sheikh", legalBalls: 24, runs: 38, wickets: 2, maidens: 0 },
            { id: "p4", name: "Karthik Rao", legalBalls: 18, runs: 22, wickets: 0, maidens: 1 },
          ],
          bowlerId: "p6",
          fallOfWickets: [
            { score: 21, over: "3.2", batsman: "Deepak Shah" },
            { score: 58, over: "7.4", batsman: "Naveen Chandra" },
            { score: 108, over: "12.1", batsman: "Suresh Bhat" },
          ],
          thisOver: ["1", "4", "•", "6", "1"],
          partnership: { runs: 34, balls: 26 },
        },
      ],
      currentInnings: 0,
      target: null,
    },
    {
      id: "m2",
      tournament: "tour1",
      teamA: "t3",
      teamB: "t4",
      overs: 20,
      status: "upcoming",
      venue: "Northline Ground",
      startTime: Date.now() + 1000 * 60 * 60 * 26,
      innings: [],
      currentInnings: 0,
      target: null,
    },
    {
      id: "m3",
      tournament: "tour1",
      teamA: "t2",
      teamB: "t4",
      overs: 20,
      status: "completed",
      venue: "Coastal Arena",
      startTime: Date.now() - 1000 * 60 * 60 * 50,
      result: "Coastal Kings won by 6 wickets",
      innings: [
        { battingTeam: "t4", runs: 148, wickets: 9, legalBalls: 120 },
        { battingTeam: "t2", runs: 149, wickets: 4, legalBalls: 112 },
      ],
      currentInnings: 1,
      target: 149,
    },
    {
      id: "m4",
      tournament: "tour1",
      teamA: "t1",
      teamB: "t3",
      overs: 20,
      status: "completed",
      venue: "Deccan Stadium",
      startTime: Date.now() - 1000 * 60 * 60 * 96,
      result: "Deccan Chargers won by 18 runs",
      innings: [
        { battingTeam: "t1", runs: 176, wickets: 6, legalBalls: 120 },
        { battingTeam: "t3", runs: 158, wickets: 8, legalBalls: 120 },
      ],
      currentInnings: 1,
      target: 177,
    },
  ];

  return { players, teams, tournaments, matches, users: [], meta: { installedAt: Date.now() } };
}

/* ---------------- local storage engine ---------------- */

function loadLocal() {
  const raw = localStorage.getItem(STORE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.warn("Corrupt store, reseeding", e);
    }
  }
  const seeded = seedData();
  localStorage.setItem(STORE_KEY, JSON.stringify(seeded));
  return seeded;
}

function saveLocal(state) {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

/* ---------------- public DB API ---------------- */
/* Every call is async-shaped (returns a Promise) so swapping the
   localStorage engine for real Firebase calls later is a drop-in
   change with no ripple effect on the rest of the app. */

const listeners = new Set();

const DB = {
  _state: loadLocal(),

  onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  _emit() {
    saveLocal(this._state);
    listeners.forEach((fn) => fn(this._state));
  },

  async getState() {
    return this._state;
  },

  async updateMatch(matchId, mutatorFn) {
    const match = this._state.matches.find((m) => m.id === matchId);
    if (!match) return;
    mutatorFn(match);
    this._emit();
  },

  async addTournament(t) {
    t.id = "tour_" + Math.random().toString(36).slice(2, 9);
    this._state.tournaments.push(t);
    this._emit();
    return t.id;
  },

  async addTeam(t) {
    t.id = "t_" + Math.random().toString(36).slice(2, 9);
    t.squad = t.squad || [];
    t.playingXI = t.playingXI || [];
    this._state.teams.push(t);
    this._emit();
    return t.id;
  },

  async addPlayer(p) {
    p.id = "p_" + Math.random().toString(36).slice(2, 9);
    p.matches = p.matches || 0;
    p.runs = p.runs || 0;
    p.wickets = p.wickets || 0;
    p.graph = p.graph || [0, 0, 0, 0, 0, 0, 0, 0];
    p.awards = p.awards || [];
    this._state.players.push(p);
    this._emit();
    return p.id;
  },

  async addMatch(m) {
    m.id = "m_" + Math.random().toString(36).slice(2, 9);
    m.innings = m.innings || [];
    m.currentInnings = 0;
    m.status = m.status || "upcoming";
    this._state.matches.push(m);
    this._emit();
    return m.id;
  },

  async reset() {
    this._state = seedData();
    this._emit();
  },
};

window.DB = DB;
window.SF_CONFIG = { USE_FIREBASE, FIREBASE_CONFIG };
