/* Super Friends — App Shell, Router, Home/Team/Player/Tournament screens */

/* ---------------- tiny helpers ---------------- */
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const el = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const fmtOvers = (balls) => `${Math.floor(balls / 6)}.${balls % 6}`;
const teamById = (state, id) => state.teams.find((t) => t.id === id);
const playerById = (state, id) => state.players.find((p) => p.id === id);
const initials = (name) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
const avatarColor = (seed) => {
  const colors = ["#5B5FEF", "#00A891", "#E23E5C", "#C77E00", "#7C7FF5", "#2FA6E0"];
  let h = 0; for (const c of seed) h = (h * 31 + c.charCodeAt(0)) % colors.length;
  return colors[h];
};
function toast(msg) {
  const t = el(`<div class="toast">${msg}</div>`);
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

/* ---------------- icons (inline SVG, original set) ---------------- */
const ICON = {
  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>`,
  trophy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10v4a5 5 0 0 1-10 0V4Z"/><path d="M7 5H4a3 3 0 0 0 3 4M17 5h3a3 3 0 0 1-3 4"/><path d="M12 13v4M9 21h6M10 17h4v4h-4z"/></svg>`,
  users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6"/><circle cx="17" cy="9" r="2.4"/><path d="M16 14c2.8.3 5 2.4 5 6"/></svg>`,
  admin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8L12 2z"/></svg>`,
  ball: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M6 6c3 2 3 10 0 12M18 6c-3 2-3 10 0 12"/></svg>`,
  bat: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 5l-9 9-3 6 6-3 9-9-3-3z"/><path d="M5 19l2-2"/></svg>`,
  chart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 20V10M12 20V4M20 20v-7"/></svg>`,
  sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`,
  moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>`,
  bell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>`,
  bolt: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"/></svg>`,
  eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/></svg>`,
  chevronR: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`,
};

/* ---------------- theme ---------------- */
function initTheme() {
  const saved = localStorage.getItem("sf_theme") || "light";
  document.documentElement.setAttribute("data-theme", saved);
}
function toggleTheme() {
  const cur = document.documentElement.getAttribute("data-theme");
  const next = cur === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("sf_theme", next);
}

/* ---------------- router ---------------- */
const routes = {};
function registerRoute(name, renderFn) { routes[name] = renderFn; }

async function navigate(hash) {
  if (!hash) hash = "#/home";
  window.location.hash = hash;
}

async function renderRoute() {
  const hash = window.location.hash || "#/home";
  const [, path, param] = hash.match(/^#\/(\w+)\/?(.*)$/) || [, "home", ""];
  const main = $("#view");
  const state = await DB.getState();
  const fn = routes[path] || routes.home;
  main.innerHTML = "";
  main.appendChild(await fn(state, param));
  $$(".nav-item").forEach((n) => n.classList.toggle("active", n.dataset.route === path));
  window.scrollTo({ top: 0, behavior: "instant" });
}

/* ---------------- HOME ---------------- */
async function renderHome(state) {
  const live = state.matches.filter((m) => m.status === "live");
  const upcoming = state.matches.filter((m) => m.status === "upcoming");
  const recent = state.matches.filter((m) => m.status === "completed").slice(0, 4);
  const wrap = el(`<div></div>`);

  wrap.appendChild(el(`
    <div class="quick-grid">
      ${quickBtn("bolt", "Start Match", "#5B5FEF", "#/admin/score")}
      ${quickBtn("eye", "View Score", "#00A891", "#/live/" + (live[0]?.id || ""))}
      ${quickBtn("users", "Teams", "#C77E00", "#/teams")}
      ${quickBtn("trophy", "Tournament", "#E23E5C", "#/tournament/" + (state.tournaments[0]?.id || ""))}
    </div>
  `));

  // Live matches
  wrap.appendChild(sectionHead("Live Matches", live.length ? "" : null));
  if (live.length) {
    const hs = el(`<div class="hscroll"></div>`);
    live.forEach((m) => hs.appendChild(liveMatchCard(state, m)));
    wrap.appendChild(hs);
  } else {
    wrap.appendChild(el(`<div class="empty-state">No live matches right now.</div>`));
  }

  // Upcoming
  wrap.appendChild(sectionHead("Upcoming Matches"));
  const upCard = el(`<div class="glass-card"></div>`);
  if (!upcoming.length) upCard.appendChild(el(`<div class="empty-state">Nothing scheduled yet.</div>`));
  upcoming.forEach((m) => upCard.appendChild(upcomingRow(state, m)));
  wrap.appendChild(upCard);

  // Recent Results
  wrap.appendChild(sectionHead("Recent Results"));
  const resCard = el(`<div class="glass-card"></div>`);
  recent.forEach((m) => resCard.appendChild(resultRow(state, m)));
  wrap.appendChild(resCard);

  // Tournaments
  wrap.appendChild(sectionHead("Tournaments"));
  const ths = el(`<div class="hscroll"></div>`);
  state.tournaments.forEach((t) => ths.appendChild(tournamentCard(state, t)));
  wrap.appendChild(ths);

  // Featured players
  wrap.appendChild(sectionHead("Featured Players"));
  const phs = el(`<div class="hscroll"></div>`);
  [...state.players].sort((a, b) => b.runs - a.runs).slice(0, 6).forEach((p) => phs.appendChild(playerChip(p)));
  wrap.appendChild(phs);

  return wrap;
}

function quickBtn(icon, label, color, route) {
  return `<a class="quick-btn" href="${route}"><span class="qi" style="background:${color}">${ICON[icon]}</span>${label}</a>`;
}
function sectionHead(title, linkHref) {
  return el(`<div class="section-head"><h3>${title}</h3>${linkHref !== null ? `<a class="link" href="#">See all</a>` : ""}</div>`);
}

function liveMatchCard(state, m) {
  const a = teamById(state, m.teamA), b = teamById(state, m.teamB);
  const inn = m.innings[m.currentInnings];
  const battingTeam = teamById(state, inn.battingTeam);
  const bowlingId = inn.battingTeam === m.teamA ? m.teamB : m.teamA;
  const bowlingTeam = teamById(state, bowlingId);
  const rr = inn.legalBalls > 0 ? (inn.runs / (inn.legalBalls / 6)).toFixed(2) : "0.00";
  const winPct = Math.min(92, Math.max(8, Math.round(50 + (inn.runs - inn.wickets * 8) / 4)));
  const card = el(`
    <a href="#/live/${m.id}" class="glass-card match-card live">
      <span class="live-badge"><span class="live-dot"></span> LIVE</span>
      <div class="match-teams">
        <div class="team-row">
          <span class="team-id"><span class="team-dot" style="background:${battingTeam.color}"></span>${battingTeam.short}</span>
          <span class="team-score">${inn.runs}/${inn.wickets} <span style="font-size:11px;color:var(--text-faint);font-weight:600">(${fmtOvers(inn.legalBalls)})</span></span>
        </div>
        <div class="team-row">
          <span class="team-id"><span class="team-dot" style="background:${bowlingTeam.color}"></span>${bowlingTeam.short}</span>
          <span class="team-score" style="color:var(--text-faint)">yet to bat</span>
        </div>
      </div>
      <div class="match-meta"><span>CRR ${rr}</span><span>${m.venue}</span></div>
      <div class="win-arc-wrap">
        <span style="font-size:10.5px;color:var(--text-faint);font-weight:700">${battingTeam.short}</span>
        <div class="win-bar"><span style="width:${winPct}%; background:${battingTeam.color}"></span><span style="width:${100 - winPct}%; background:${bowlingTeam.color}"></span></div>
        <span style="font-size:10.5px;color:var(--text-faint);font-weight:700">${bowlingTeam.short}</span>
      </div>
    </a>
  `);
  return card;
}

function upcomingRow(state, m) {
  const a = teamById(state, m.teamA), b = teamById(state, m.teamB);
  const dt = new Date(m.startTime);
  return el(`
    <div class="result-row">
      <div>
        <div class="result-teams">${a.short} vs ${b.short}</div>
        <div class="result-sub">${m.venue} · ${dt.toLocaleDateString([], { month: "short", day: "numeric" })}, ${dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
      </div>
      <span class="pill">Upcoming</span>
    </div>
  `);
}

function resultRow(state, m) {
  const a = teamById(state, m.teamA), b = teamById(state, m.teamB);
  const i0 = m.innings[0], i1 = m.innings[1];
  return el(`
    <a href="#/live/${m.id}" class="result-row">
      <div>
        <div class="result-teams">${a.short} vs ${b.short}</div>
        <div class="result-sub">${m.result || "Completed"}</div>
      </div>
      <div class="result-score">${i0 ? i0.runs + "/" + i0.wickets : ""}<br><span style="color:var(--text-faint);font-weight:600">${i1 ? i1.runs + "/" + i1.wickets : ""}</span></div>
    </a>
  `);
}

function tournamentCard(state, t) {
  const grad = ["#5B5FEF, #8A8DFB", "#00A891, #2FE0C4", "#E23E5C, #FF8FA3", "#C77E00, #FFC24B"];
  const g = grad[Math.abs(t.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % grad.length];
  return el(`
    <a href="#/tournament/${t.id}" class="tournament-card" style="background:linear-gradient(135deg, ${g})">
      <h4>${t.name}</h4>
      <div class="t-meta">Season ${t.season} · ${t.teams.length} teams</div>
      <div class="t-stats">
        <div><span>Matches</span><b>${state.matches.filter((m) => m.tournament === t.id).length}</b></div>
        <div><span>Leader</span><b>${teamById(state, t.pointsTable[0].team).short}</b></div>
      </div>
    </a>
  `);
}

function playerChip(p) {
  return el(`
    <a href="#/player/${p.id}" class="player-chip">
      <div class="avatar" style="background:${avatarColor(p.name)}">${initials(p.name)}</div>
      <div class="p-name">${p.name.split(" ")[0]}</div>
      <div class="p-role">${p.role}</div>
    </a>
  `);
}

/* ---------------- TEAMS LIST + TEAM PAGE ---------------- */
async function renderTeamsList(state) {
  const wrap = el(`<div><div class="section-head"><h3>All Teams</h3></div></div>`);
  const grid = el(`<div class="grid-2"></div>`);
  state.teams.forEach((t) => {
    grid.appendChild(el(`
      <a href="#/team/${t.id}" class="glass-card" style="text-align:center">
        <div class="avatar" style="background:${t.color};margin:0 auto 8px;border-radius:14px">${t.short}</div>
        <div style="font-weight:700;font-size:13px">${t.name}</div>
        <div style="font-size:11px;color:var(--text-faint);margin-top:2px">${t.squad.length} players</div>
      </a>
    `));
  });
  wrap.appendChild(grid);
  return wrap;
}

async function renderTeam(state, id) {
  const t = teamById(state, id);
  if (!t) return el(`<div class="empty-state">Team not found.</div>`);
  const captain = playerById(state, t.captain);
  const wrap = el(`<div></div>`);
  wrap.appendChild(el(`
    <div class="glass-card" style="text-align:center">
      <div class="avatar lg" style="background:${t.color};margin:0 auto 10px;border-radius:22px">${t.short}</div>
      <h2 style="font-size:19px">${t.name}</h2>
      <div style="font-size:12px;color:var(--text-dim);margin-top:4px">Captain: ${captain ? captain.name : "—"}</div>
    </div>
  `));

  const wins = state.matches.filter((m) => m.status === "completed" && (m.teamA === id || m.teamB === id) && m.result && m.result.startsWith(t.name)).length;
  const played = state.matches.filter((m) => m.status === "completed" && (m.teamA === id || m.teamB === id)).length;
  wrap.appendChild(el(`
    <div class="grid-2" style="margin-top:14px">
      <div class="stat-box"><b>${played}</b><span>Matches</span></div>
      <div class="stat-box"><b>${wins}</b><span>Wins</span></div>
    </div>
  `));

  wrap.appendChild(sectionHead("Playing XI"));
  const xiCard = el(`<div class="glass-card"></div>`);
  t.playingXI.forEach((pid) => xiCard.appendChild(squadRow(state, pid, t)));
  wrap.appendChild(xiCard);

  wrap.appendChild(sectionHead("Full Squad"));
  const squadCard = el(`<div class="glass-card"></div>`);
  t.squad.forEach((pid) => squadCard.appendChild(squadRow(state, pid, t)));
  wrap.appendChild(squadCard);

  return wrap;
}

function squadRow(state, pid, team) {
  const p = playerById(state, pid);
  if (!p) return el(`<div></div>`);
  return el(`
    <a href="#/player/${p.id}" class="result-row">
      <div style="display:flex;align-items:center;gap:10px">
        <div class="avatar sm" style="background:${avatarColor(p.name)}">${initials(p.name)}</div>
        <div>
          <div class="result-teams">${p.name} ${team.captain === p.id ? '<span class="pill">C</span>' : ""}</div>
          <div class="result-sub">${p.role}</div>
        </div>
      </div>
      ${ICON.chevronR}
    </a>
  `);
}

/* ---------------- PLAYER PROFILE ---------------- */
async function renderPlayer(state, id) {
  const p = playerById(state, id);
  if (!p) return el(`<div class="empty-state">Player not found.</div>`);
  const team = teamById(state, p.team);
  const wrap = el(`<div></div>`);
  wrap.appendChild(el(`
    <div class="glass-card" style="text-align:center">
      <div class="avatar lg" style="background:${avatarColor(p.name)};margin:0 auto 10px">${initials(p.name)}</div>
      <h2 style="font-size:19px">${p.name}</h2>
      <div style="font-size:12px;color:var(--text-dim);margin-top:4px">${p.role} · ${team ? team.name : "Free agent"}</div>
    </div>
  `));

  wrap.appendChild(sectionHead("Career Statistics", null));
  const stats = el(`<div class="grid-2"></div>`);
  const boxes = [
    ["Matches", p.matches], ["Runs", p.runs],
    ["Batting Avg", p.avg], ["Strike Rate", p.sr],
    ["Wickets", p.wickets], ["Bowling Avg", p.bowlAvg ?? "—"],
  ];
  boxes.forEach(([label, val]) => stats.appendChild(el(`<div class="stat-box"><b>${val}</b><span>${label}</span></div>`)));
  wrap.appendChild(stats);

  wrap.appendChild(sectionHead("Performance (last 8 innings)", null));
  wrap.appendChild(el(`<div class="glass-card">${performanceGraphSvg(p.graph)}</div>`));

  wrap.appendChild(sectionHead("Awards", null));
  const awardsCard = el(`<div class="glass-card"></div>`);
  if (!p.awards.length) awardsCard.appendChild(el(`<div class="empty-state">No awards yet.</div>`));
  p.awards.forEach((a) => awardsCard.appendChild(el(`<div class="result-row"><span style="color:var(--gold)">${ICON.trophy}</span>&nbsp; <span style="font-size:12.5px;font-weight:600">${a}</span></div>`)));
  wrap.appendChild(awardsCard);

  return wrap;
}

function performanceGraphSvg(data) {
  const w = 300, h = 110, pad = 10;
  const max = Math.max(...data, 1);
  const step = (w - pad * 2) / (data.length - 1);
  const pts = data.map((v, i) => [pad + i * step, h - pad - (v / max) * (h - pad * 2)]);
  const path = pts.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const area = path + ` L${pts[pts.length - 1][0]},${h - pad} L${pts[0][0]},${h - pad} Z`;
  const bars = data.map((v, i) => {
    const bw = step * 0.5;
    const bh = (v / max) * (h - pad * 2);
    return `<rect x="${pad + i * step - bw / 2}" y="${h - pad - bh}" width="${bw}" height="${bh}" rx="3" fill="var(--primary)" opacity="0.85"/>`;
  }).join("");
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}">${bars}</svg>`;
}

/* ---------------- TOURNAMENT ---------------- */
async function renderTournament(state, id) {
  const t = state.tournaments.find((x) => x.id === id) || state.tournaments[0];
  if (!t) return el(`<div class="empty-state">No tournaments yet.</div>`);
  const wrap = el(`<div></div>`);
  wrap.appendChild(el(`
    <div class="glass-card">
      <h2 style="font-size:18px">${t.name}</h2>
      <div style="font-size:12px;color:var(--text-dim);margin-top:4px">Season ${t.season} · ${t.teams.length} teams</div>
    </div>
  `));

  wrap.appendChild(el(`
    <div class="tabs" style="margin-top:16px">
      <div class="tab active" data-tab="points">Points</div>
      <div class="tab" data-tab="fixtures">Fixtures</div>
      <div class="tab" data-tab="bracket">Bracket</div>
      <div class="tab" data-tab="leaders">Leaders</div>
    </div>
  `));

  const panel = el(`<div style="margin-top:14px"></div>`);
  wrap.appendChild(panel);

  function showTab(tab) {
    $$(".tab", wrap).forEach((el2) => el2.classList.toggle("active", el2.dataset.tab === tab));
    panel.innerHTML = "";
    if (tab === "points") panel.appendChild(pointsTable(state, t));
    if (tab === "fixtures") panel.appendChild(fixturesResults(state, t));
    if (tab === "bracket") panel.appendChild(bracketView(state, t));
    if (tab === "leaders") panel.appendChild(leadersView(state, t));
  }
  wrap.addEventListener("click", (e) => {
    const tab = e.target.closest(".tab");
    if (tab) showTab(tab.dataset.tab);
  });
  showTab("points");
  return wrap;
}

function pointsTable(state, t) {
  const rows = t.pointsTable.map((r, i) => {
    const team = teamById(state, r.team);
    return `<tr><td>${i + 1}. ${team.short}</td><td>${r.played}</td><td>${r.won}</td><td>${r.lost}</td><td>${r.nrr > 0 ? "+" : ""}${r.nrr}</td><td><b>${r.pts}</b></td></tr>`;
  }).join("");
  return el(`
    <div class="table-wrap"><table class="sf-table">
      <thead><tr><th>Team</th><th>P</th><th>W</th><th>L</th><th>NRR</th><th>Pts</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
  `);
}

function fixturesResults(state, t) {
  const matches = state.matches.filter((m) => m.tournament === t.id);
  const card = el(`<div class="glass-card"></div>`);
  matches.forEach((m) => {
    if (m.status === "completed") card.appendChild(resultRow(state, m));
    else if (m.status === "upcoming") card.appendChild(upcomingRow(state, m));
    else card.appendChild(liveRowCompact(state, m));
  });
  return card;
}

function liveRowCompact(state, m) {
  const inn = m.innings[m.currentInnings];
  const bt = teamById(state, inn.battingTeam);
  return el(`<a href="#/live/${m.id}" class="result-row"><div><div class="result-teams">${teamById(state, m.teamA).short} vs ${teamById(state, m.teamB).short}</div><div class="result-sub">Live now</div></div><div class="result-score">${bt.short} ${inn.runs}/${inn.wickets}</div></a>`);
}

function bracketView(state, t) {
  if (!t.bracket) return el(`<div class="empty-state">Bracket not set up.</div>`);
  const semis = t.bracket.semis.map((s) => bracketMatch(state, s)).join("");
  const final = bracketMatch(state, t.bracket.final);
  return el(`
    <div class="bracket">
      <div class="bracket-round"><div class="bracket-round-title">Semi Finals</div>${semis}</div>
      <div class="bracket-round"><div class="bracket-round-title">Final</div>${final}</div>
    </div>
  `);
}
function bracketMatch(state, m) {
  const a = teamById(state, m.a), b = teamById(state, m.b);
  return `<div class="bracket-match">
    <div class="bracket-team ${m.winner === m.a ? "winner" : ""}">${a.name} ${m.winner === m.a ? "✓" : ""}</div>
    <div class="bracket-team ${m.winner === m.b ? "winner" : ""}">${b.name} ${m.winner === m.b ? "✓" : ""}</div>
  </div>`;
}

function leadersView(state, t) {
  const wrap = el(`<div></div>`);
  const rows = [
    ["Orange Cap — Most Runs", t.orangeCap, (p) => p.runs + " runs"],
    ["Purple Cap — Most Wickets", t.purpleCap, (p) => p.wickets + " wkts"],
  ];
  rows.forEach(([label, pid, fmt]) => {
    const p = playerById(state, pid);
    wrap.appendChild(el(`
      <div class="glass-card" style="margin-bottom:12px;display:flex;align-items:center;gap:12px">
        <div class="avatar" style="background:${avatarColor(p.name)}">${initials(p.name)}</div>
        <div><div style="font-size:11px;color:var(--text-faint);font-weight:700;text-transform:uppercase">${label}</div><div style="font-weight:700">${p.name}</div></div>
        <div style="margin-left:auto;font-family:var(--font-display);font-weight:800">${fmt(p)}</div>
      </div>
    `));
  });

  wrap.appendChild(sectionHead("Most Sixes / Fours", null));
  const msmf = el(`<div class="grid-2"></div>`);
  const sixP = playerById(state, t.mostSixes.player), fourP = playerById(state, t.mostFours.player);
  msmf.appendChild(el(`<div class="stat-box"><b>${t.mostSixes.count}</b><span>${sixP.name} · Sixes</span></div>`));
  msmf.appendChild(el(`<div class="stat-box"><b>${t.mostFours.count}</b><span>${fourP.name} · Fours</span></div>`));
  wrap.appendChild(msmf);

  wrap.appendChild(sectionHead("MVP Leaderboard", null));
  const mvpCard = el(`<div class="glass-card"></div>`);
  t.mvp.forEach((row, i) => {
    const p = playerById(state, row.player);
    mvpCard.appendChild(el(`
      <div class="leaderboard-row">
        <div class="leaderboard-rank">${i + 1}</div>
        <div class="avatar sm" style="background:${avatarColor(p.name)}">${initials(p.name)}</div>
        <div class="leaderboard-info"><b>${p.name}</b><span>${p.role}</span></div>
        <div class="leaderboard-val">${row.points}</div>
      </div>
    `));
  });
  wrap.appendChild(mvpCard);
  return wrap;
}

/* ---------------- register routes (live/admin come from other files) ---------------- */
registerRoute("home", renderHome);
registerRoute("teams", renderTeamsList);
registerRoute("team", renderTeam);
registerRoute("player", renderPlayer);
registerRoute("tournament", renderTournament);

/* ---------------- boot ---------------- */
window.addEventListener("hashchange", renderRoute);
window.addEventListener("DOMContentLoaded", async () => {
  initTheme();
  $("#themeToggle").innerHTML = document.documentElement.getAttribute("data-theme") === "dark" ? ICON.sun : ICON.moon;
  $("#themeToggle").addEventListener("click", () => {
    toggleTheme();
    $("#themeToggle").innerHTML = document.documentElement.getAttribute("data-theme") === "dark" ? ICON.sun : ICON.moon;
  });
  $("#notifBtn").addEventListener("click", requestNotifPermission);
  DB.onChange(() => renderRoute());
  await renderRoute();
  registerSW();
  setupInstallPrompt();
});

async function requestNotifPermission() {
  if (!("Notification" in window)) { toast("Notifications aren't supported in this browser."); return; }
  const perm = await Notification.requestPermission();
  if (perm === "granted") {
    toast("Notifications enabled — you'll get alerts for wickets & sixes.");
    new Notification("Super Friends", { body: "You're all set for live match alerts 🏏", icon: "icons/icon-192.png" });
  } else {
    toast("Notifications blocked. You can enable them in browser settings.");
  }
}
function notifyEvent(title, body) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body, icon: "icons/icon-192.png" });
  }
}
window.notifyEvent = notifyEvent;

function registerSW() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch((e) => console.warn("SW registration failed", e));
  }
}

let deferredPrompt;
function setupInstallPrompt() {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const banner = el(`
      <div class="glass-card install-banner">
        <span style="color:var(--primary)">${ICON.bolt}</span>
        <div style="flex:1"><b style="font-size:13px">Install Super Friends</b><div style="font-size:11px;color:var(--text-faint)">Add to your home screen for the full app experience.</div></div>
        <button class="btn btn-primary btn-sm" id="installBtn">Install</button>
      </div>
    `);
    document.getElementById("view").prepend(banner);
    banner.querySelector("#installBtn").addEventListener("click", async () => {
      banner.remove();
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
    });
  });
}
