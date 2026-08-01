/* Super Friends — Live Score screen + ball-by-ball scoring engine + Admin panel */

/* In-memory undo stacks per match (session-only, not persisted — matches the
   "local session" scope of this build; wire to a Firebase transaction log
   for durable cross-device undo once USE_FIREBASE is on). */
const undoStacks = {};
function pushUndo(matchId, match) {
  if (!undoStacks[matchId]) undoStacks[matchId] = [];
  undoStacks[matchId].push(JSON.stringify(match));
  if (undoStacks[matchId].length > 40) undoStacks[matchId].shift();
}
function popUndo(matchId) {
  const stack = undoStacks[matchId];
  if (!stack || !stack.length) return null;
  return JSON.parse(stack.pop());
}

/* ---------------- ball mutation engine ---------------- */
function ensureInnings(match) { return match.innings[match.currentInnings]; }

function findB(inn, id) { return inn.batsmen.find((b) => b.id === id); }
function findBw(inn, id) { return inn.bowlers.find((b) => b.id === id); }

function overJustCompleted(inn) { return inn.legalBalls > 0 && inn.legalBalls % 6 === 0; }

function swapStrike(inn) {
  const t = inn.strikerId; inn.strikerId = inn.nonStrikerId; inn.nonStrikerId = t;
}

function recordBall(inn, label) {
  inn.thisOver = inn.thisOver ? [...inn.thisOver, label] : [label];
  if (overJustCompleted(inn)) {
    inn.thisOver = [];
  }
}

function addRun(match, runs) {
  const inn = ensureInnings(match);
  inn.runs += runs;
  const striker = findB(inn, inn.strikerId);
  striker.runs += runs; striker.balls += 1;
  if (runs === 4) striker.fours += 1;
  if (runs === 6) striker.sixes += 1;
  inn.legalBalls += 1;
  const bowler = findBw(inn, inn.bowlerId);
  bowler.runs += runs; bowler.legalBalls += 1;
  inn.partnership.runs += runs; inn.partnership.balls += 1;
  const wasOverEnd = overJustCompleted(inn);
  recordBall(inn, runs === 0 ? "•" : String(runs));
  if (runs % 2 === 1) swapStrike(inn);
  if (wasOverEnd) { swapStrike(inn); inn.awaitingNewBowler = true; }
  if (runs === 6) notifyEvent("SIX! 🎉", `${striker.name} smashes it for six!`);
  if (runs === 4) notifyEvent("FOUR!", `${striker.name} finds the boundary.`);
  finalizeBall(match);
}

function addExtra(match, kind, runs) {
  const inn = ensureInnings(match);
  inn.runs += runs;
  inn.extras[kind] = (inn.extras[kind] || 0) + runs;
  const bowler = findBw(inn, inn.bowlerId);
  if (kind === "wide" || kind === "noball") {
    bowler.runs += runs;
    recordBall(inn, (kind === "wide" ? "Wd" : "Nb") + (runs > 1 ? `+${runs - 1}` : ""));
  } else {
    inn.legalBalls += 1;
    bowler.legalBalls += 1;
    const striker = findB(inn, inn.strikerId);
    striker.balls += 1;
    inn.partnership.runs += runs; inn.partnership.balls += 1;
    const wasOverEnd = overJustCompleted(inn);
    recordBall(inn, (kind === "bye" ? "B" : "LB") + runs);
    if (runs % 2 === 1) swapStrike(inn);
    if (wasOverEnd) { swapStrike(inn); inn.awaitingNewBowler = true; }
  }
  finalizeBall(match);
}

function addWicket(match, how) {
  const inn = ensureInnings(match);
  const striker = findB(inn, inn.strikerId);
  striker.out = true; striker.how = how;
  striker.balls += 1;
  inn.wickets += 1;
  inn.legalBalls += 1;
  const bowler = findBw(inn, inn.bowlerId);
  bowler.legalBalls += 1; bowler.wickets += 1;
  inn.fallOfWickets = inn.fallOfWickets || [];
  inn.fallOfWickets.push({ score: inn.runs, over: fmtOvers(inn.legalBalls), batsman: striker.name });
  inn.partnership = { runs: 0, balls: 0 };
  const wasOverEnd = overJustCompleted(inn);
  recordBall(inn, "W");
  if (wasOverEnd) inn.awaitingNewBowler = true;
  inn.awaitingNewBatsman = true;
  notifyEvent("WICKET! 🏏", `${striker.name} is out — ${how}`);
  finalizeBall(match);
}

function newBatsman(match, name) {
  const inn = ensureInnings(match);
  const nb = { id: "b_" + Math.random().toString(36).slice(2, 8), name, runs: 0, balls: 0, fours: 0, sixes: 0, out: false, how: "" };
  inn.batsmen.push(nb);
  inn.strikerId = nb.id;
  inn.awaitingNewBatsman = false;
}

function newBowler(match, name) {
  const inn = ensureInnings(match);
  let bowler = inn.bowlers.find((b) => b.name === name);
  if (!bowler) {
    bowler = { id: "bw_" + Math.random().toString(36).slice(2, 8), name, legalBalls: 0, runs: 0, wickets: 0, maidens: 0 };
    inn.bowlers.push(bowler);
  }
  inn.bowlerId = bowler.id;
  inn.awaitingNewBowler = false;
}

function finalizeBall(match) {
  const inn = ensureInnings(match);
  const oversDone = inn.legalBalls >= match.overs * 6;
  const allOut = inn.wickets >= 10;
  const chaseWon = match.currentInnings === 1 && match.target != null && inn.runs >= match.target;
  if (chaseWon) { match.status = "completed"; match.result = computeResult(match); return; }
  if (oversDone || allOut) {
    if (match.currentInnings === 0) {
      match.target = inn.runs + 1;
    } else {
      match.status = "completed";
      match.result = computeResult(match);
    }
  }
}

function computeResult(match) {
  const teamAName = match.teamA, teamBName = match.teamB;
  const inn0 = match.innings[0], inn1 = match.innings[1];
  if (!inn1) return "Match in progress";
  if (inn1.runs >= match.target) {
    return `Chasing side won by ${10 - inn1.wickets} wicket(s)`;
  } else if (inn1.runs === match.target - 1) {
    return "Match tied";
  }
  return `Defending side won by ${match.target - 1 - inn1.runs} run(s)`;
}

function startSecondInnings(match, strikerName, nonStrikerName, bowlerName) {
  const first = match.innings[0];
  const newBattingTeam = first.battingTeam === match.teamA ? match.teamB : match.teamA;
  const newBowlingTeam = first.battingTeam;
  const striker = { id: "b_" + Math.random().toString(36).slice(2, 8), name: strikerName, runs: 0, balls: 0, fours: 0, sixes: 0, out: false, how: "" };
  const nonStriker = { id: "b_" + Math.random().toString(36).slice(2, 8), name: nonStrikerName, runs: 0, balls: 0, fours: 0, sixes: 0, out: false, how: "" };
  const bowler = { id: "bw_" + Math.random().toString(36).slice(2, 8), name: bowlerName, legalBalls: 0, runs: 0, wickets: 0, maidens: 0 };
  match.innings.push({
    battingTeam: newBattingTeam, bowlingTeam: newBowlingTeam,
    runs: 0, wickets: 0, legalBalls: 0,
    extras: { wide: 0, noball: 0, bye: 0, legbye: 0 },
    batsmen: [striker, nonStriker], strikerId: striker.id, nonStrikerId: nonStriker.id,
    bowlers: [bowler], bowlerId: bowler.id,
    fallOfWickets: [], thisOver: [], partnership: { runs: 0, balls: 0 },
    awaitingNewBatsman: false, awaitingNewBowler: false,
  });
  match.currentInnings = 1;
  match.status = "live";
}

/* ---------------- LIVE SCORE SCREEN (spectator view) ---------------- */
async function renderLive(state, matchId) {
  const match = state.matches.find((m) => m.id === matchId) || state.matches.find((m) => m.status === "live") || state.matches[0];
  if (!match) return el(`<div class="empty-state">No matches yet. Create one from the Admin panel.</div>`);
  if (!match.innings.length) return el(`<div class="empty-state">Toss hasn't happened yet for this match.</div>`);

  const wrap = el(`<div></div>`);
  const teamA = teamById(state, match.teamA), teamB = teamById(state, match.teamB);

  // innings selector
  if (match.innings.length > 1 || match.status !== "upcoming") {
    const sel = el(`<div class="tabs" style="margin-bottom:14px"></div>`);
    match.innings.forEach((inn, i) => {
      const t = teamById(state, inn.battingTeam);
      sel.appendChild(el(`<div class="tab ${i === match.currentInningsView ?? i === match.currentInnings ? "active" : ""}" data-inn="${i}">${t.short} Innings</div>`));
    });
    wrap.appendChild(sel);
  }

  let viewInnIdx = match.currentInnings;
  const panel = el(`<div></div>`);
  wrap.appendChild(panel);

  function draw(idx) {
    panel.innerHTML = "";
    panel.appendChild(liveInningsPanel(state, match, idx));
  }
  wrap.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-inn]");
    if (tab) {
      $$("[data-inn]", wrap).forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      draw(Number(tab.dataset.inn));
    }
  });
  draw(viewInnIdx);

  if (match.status === "live") {
    wrap.appendChild(el(`<a href="#/admin/score/${match.id}" class="btn btn-primary btn-block" style="margin-top:18px">Score this match ${ICON.bolt}</a>`));
  }
  return wrap;
}

function liveInningsPanel(state, match, idx) {
  const inn = match.innings[idx];
  const battingTeam = teamById(state, inn.battingTeam);
  const bowlingTeam = teamById(state, inn.bowlingTeam || (inn.battingTeam === match.teamA ? match.teamB : match.teamA));
  const wrap = el(`<div></div>`);

  const rr = inn.legalBalls > 0 ? (inn.runs / (inn.legalBalls / 6)).toFixed(2) : "0.00";
  const ballsLeft = match.overs * 6 - inn.legalBalls;
  const reqRR = idx === 1 && match.target != null && ballsLeft > 0 ? (((match.target - inn.runs) / ballsLeft) * 6).toFixed(2) : null;
  const needText = idx === 1 && match.target != null ? `Need ${Math.max(0, match.target - inn.runs)} off ${ballsLeft} balls` : null;

  let statusText = match.status === "completed" ? (match.result || "Match completed") : (match.status === "live" ? `${battingTeam.short} batting · ${bowlingTeam.short} bowling` : "Yet to begin");

  wrap.appendChild(el(`
    <div class="glass-card score-hero">
      <span class="status-banner">${match.status === "live" ? '<span class="live-dot" style="background:currentColor"></span> LIVE' : match.status.toUpperCase()}</span>
      <div class="teams-line">${teamById(state, match.teamA).short} vs ${teamById(state, match.teamB).short} · ${match.venue}</div>
      <div class="score-big">${inn.runs}<span style="color:var(--text-faint)">/${inn.wickets}</span></div>
      <div class="score-overs">${battingTeam.short} · Overs ${fmtOvers(inn.legalBalls)} / ${match.overs}</div>
      <div class="rr-row">
        <div class="rr-item"><b>${rr}</b><span>Run Rate</span></div>
        ${reqRR ? `<div class="rr-item"><b>${reqRR}</b><span>Req. Rate</span></div>` : ""}
      </div>
      ${needText ? `<div style="margin-top:10px;font-size:12.5px;font-weight:700;color:var(--primary)">${needText}</div>` : ""}
      <div style="margin-top:10px;font-size:12px;color:var(--text-dim)">${statusText}</div>
    </div>
  `));

  if (idx === 1 && match.target != null) {
    const pct = Math.min(100, Math.round((inn.runs / match.target) * 100));
    wrap.appendChild(el(`
      <div class="glass-card" style="margin-top:12px">
        <div class="section-head" style="margin:0 0 8px"><h3 style="font-size:13px">Win Probability</h3></div>
        <div class="win-bar"><span style="width:${pct}%;background:${battingTeam.color}"></span><span style="width:${100 - pct}%;background:${bowlingTeam.color}"></span></div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-faint);margin-top:6px"><span>${battingTeam.short} ${pct}%</span><span>${bowlingTeam.short} ${100 - pct}%</span></div>
      </div>
    `));
  }

  if (inn.thisOver) {
    wrap.appendChild(sectionHead("This Over", null));
    wrap.appendChild(el(`<div class="glass-card"><div class="ball-strip">${(inn.thisOver.length ? inn.thisOver : ["—"]).map(ballChip).join("")}</div></div>`));
  }

  if (inn.partnership) {
    wrap.appendChild(sectionHead("Partnership", null));
    wrap.appendChild(el(`<div class="glass-card" style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:12.5px;color:var(--text-dim)">Current partnership</span><b style="font-family:var(--font-display);font-size:16px">${inn.partnership.runs} (${inn.partnership.balls})</b></div>`));
  }

  wrap.appendChild(sectionHead("Batting", null));
  wrap.appendChild(battingTable(inn));

  wrap.appendChild(sectionHead("Bowling", null));
  wrap.appendChild(bowlingTable(inn));

  if (inn.fallOfWickets && inn.fallOfWickets.length) {
    wrap.appendChild(sectionHead("Fall of Wickets", null));
    wrap.appendChild(el(`<div class="glass-card" style="font-size:12px;color:var(--text-dim);line-height:1.9">${inn.fallOfWickets.map((f) => `${f.score}-${inn.fallOfWickets.indexOf(f) + 1} (${f.batsman}, ${f.over} ov)`).join(" &nbsp;•&nbsp; ")}</div>`));
  }

  wrap.appendChild(sectionHead("Extras", null));
  const ex = inn.extras || {};
  const total = (ex.wide || 0) + (ex.noball || 0) + (ex.bye || 0) + (ex.legbye || 0);
  wrap.appendChild(el(`<div class="glass-card" style="font-size:12.5px;color:var(--text-dim)">Total <b style="color:var(--text)">${total}</b> &nbsp;(wd ${ex.wide || 0}, nb ${ex.noball || 0}, b ${ex.bye || 0}, lb ${ex.legbye || 0})</div>`));

  const battedIds = new Set(inn.batsmen.map((b) => b.id));
  const teamObj = teamById(state, inn.battingTeam);
  const yetToBat = teamObj.squad.map((pid) => playerById(state, pid)).filter((p) => p && !inn.batsmen.some((b) => b.name === p.name));
  if (yetToBat.length) {
    wrap.appendChild(sectionHead("Yet to Bat", null));
    wrap.appendChild(el(`<div class="glass-card" style="font-size:12.5px;color:var(--text-dim)">${yetToBat.map((p) => p.name).join(", ")}</div>`));
  }

  wrap.appendChild(sectionHead("Match Summary", null));
  wrap.appendChild(el(`<div class="glass-card" style="font-size:12.5px;color:var(--text-dim);line-height:1.7">
    ${match.toss ? `${teamById(state, match.toss.winner).name} won the toss and chose to ${match.toss.decision}.` : ""}
    ${match.innings.map((i, n) => `<br>Innings ${n + 1}: ${teamById(state, i.battingTeam).short} ${i.runs}/${i.wickets} (${fmtOvers(i.legalBalls)} ov)`).join("")}
    ${match.result ? `<br><b style="color:var(--text)">${match.result}</b>` : ""}
  </div>`));

  return wrap;
}

function ballChip(label) {
  let bg = "#8A8DA1";
  if (label === "•") bg = "#8A8DA1";
  else if (["1", "2", "3"].includes(label)) bg = "#2FA6E0";
  else if (label === "4") bg = "#00A891";
  else if (label === "6") bg = "#C77E00";
  else if (label === "W") bg = "#E23E5C";
  else if (label.startsWith("Wd") || label.startsWith("Nb")) bg = "#8A5A2E";
  else if (label.startsWith("B") || label.startsWith("LB")) bg = "#5C6B77";
  return `<span class="ball" style="background:${bg}">${label}</span>`;
}

function battingTable(inn) {
  const rows = inn.batsmen.map((b) => {
    const sr = b.balls ? ((b.runs / b.balls) * 100).toFixed(1) : "0.0";
    const status = b.out ? b.how : (b.id === inn.strikerId ? "batting*" : (b.id === inn.nonStrikerId ? "batting" : "did not bat"));
    return `<tr><td><b>${b.name}</b>${b.id === inn.strikerId ? '<span class="striker-mark"> *</span>' : ""}<div style="font-size:10px;color:var(--text-faint)">${status}</div></td><td>${b.runs}</td><td>${b.balls}</td><td>${b.fours}</td><td>${b.sixes}</td><td>${sr}</td></tr>`;
  }).join("");
  return el(`<div class="table-wrap"><table class="sf-table"><thead><tr><th>Batter</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr></thead><tbody>${rows}</tbody></table></div>`);
}

function bowlingTable(inn) {
  const rows = inn.bowlers.map((b) => {
    const econ = b.legalBalls ? (b.runs / (b.legalBalls / 6)).toFixed(2) : "0.00";
    return `<tr><td><b>${b.name}</b>${b.id === inn.bowlerId ? '<span class="striker-mark"> *</span>' : ""}</td><td>${fmtOvers(b.legalBalls)}</td><td>${b.maidens || 0}</td><td>${b.runs}</td><td>${b.wickets}</td><td>${econ}</td></tr>`;
  }).join("");
  return el(`<div class="table-wrap"><table class="sf-table"><thead><tr><th>Bowler</th><th>O</th><th>M</th><th>R</th><th>W</th><th>Econ</th></tr></thead><tbody>${rows}</tbody></table></div>`);
}

/* ---------------- ADMIN PANEL ---------------- */
async function renderAdmin(state, param) {
  const [section, id] = (param || "").split("/");
  if (section === "score") return renderAdminScore(state, id);

  const wrap = el(`<div></div>`);
  wrap.appendChild(el(`<div class="glass-card"><h2 style="font-size:18px">Admin Panel</h2><div style="font-size:12px;color:var(--text-dim);margin-top:4px">Create content and run live scoring.</div></div>`));

  wrap.appendChild(el(`
    <div class="tabs" style="margin-top:16px">
      <div class="tab active" data-tab="tournament">Tournament</div>
      <div class="tab" data-tab="team">Team</div>
      <div class="tab" data-tab="player">Player</div>
      <div class="tab" data-tab="schedule">Schedule</div>
    </div>
  `));
  const panel = el(`<div style="margin-top:14px"></div>`);
  wrap.appendChild(panel);

  function show(tab) {
    $$(".tab", wrap).forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
    panel.innerHTML = "";
    if (tab === "tournament") panel.appendChild(formCreateTournament(state));
    if (tab === "team") panel.appendChild(formCreateTeam(state));
    if (tab === "player") panel.appendChild(formCreatePlayer(state));
    if (tab === "schedule") panel.appendChild(formScheduleMatch(state));
  }
  wrap.addEventListener("click", (e) => { const t = e.target.closest(".tab"); if (t) show(t.dataset.tab); });
  show("tournament");

  wrap.appendChild(sectionHead("Live-Score a Match", null));
  const listCard = el(`<div class="glass-card"></div>`);
  const scorable = state.matches.filter((m) => m.status !== "completed");
  if (!scorable.length) listCard.appendChild(el(`<div class="empty-state">No matches to score. Schedule one above.</div>`));
  scorable.forEach((m) => {
    listCard.appendChild(el(`
      <a href="#/admin/score/${m.id}" class="result-row">
        <div><div class="result-teams">${teamById(state, m.teamA).short} vs ${teamById(state, m.teamB).short}</div><div class="result-sub">${m.status === "live" ? "Live — tap to continue scoring" : "Upcoming — tap to start toss & scoring"}</div></div>
        ${ICON.chevronR}
      </a>
    `));
  });
  wrap.appendChild(listCard);

  return wrap;
}

function formCreateTournament(state) {
  const form = el(`
    <form class="glass-card">
      <div class="field"><label>Tournament name</label><input name="name" required placeholder="e.g. Summer Smash 2026" /></div>
      <div class="field"><label>Season</label><input name="season" required placeholder="2026" /></div>
      <button class="btn btn-primary btn-block" type="submit">Create tournament ${ICON.plus}</button>
    </form>
  `);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    await DB.addTournament({ name: fd.get("name"), season: fd.get("season"), teams: [], pointsTable: [], mvp: [], orangeCap: null, purpleCap: null, mostSixes: { player: null, count: 0 }, mostFours: { player: null, count: 0 }, bracket: null });
    toast("Tournament created.");
    form.reset();
  });
  return form;
}

function formCreateTeam(state) {
  const form = el(`
    <form class="glass-card">
      <div class="field"><label>Team name</label><input name="name" required placeholder="e.g. Metro Strikers" /></div>
      <div class="field-row">
        <div class="field"><label>Short code</label><input name="short" required maxlength="4" placeholder="MST" /></div>
        <div class="field"><label>Color</label><input name="color" type="color" value="#5B5FEF" /></div>
      </div>
      <button class="btn btn-primary btn-block" type="submit">Create team ${ICON.plus}</button>
    </form>
  `);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    await DB.addTeam({ name: fd.get("name"), short: fd.get("short").toUpperCase(), color: fd.get("color"), captain: null, squad: [], playingXI: [] });
    toast("Team created.");
    form.reset();
  });
  return form;
}

function formCreatePlayer(state) {
  const form = el(`
    <form class="glass-card">
      <div class="field"><label>Player name</label><input name="name" required placeholder="e.g. Rahul Nanda" /></div>
      <div class="field-row">
        <div class="field"><label>Role</label>
          <select name="role"><option>Batter</option><option>Bowler</option><option>All-rounder</option><option>Wicketkeeper</option></select>
        </div>
        <div class="field"><label>Team</label>
          <select name="team">${state.teams.map((t) => `<option value="${t.id}">${t.name}</option>`).join("")}</select>
        </div>
      </div>
      <button class="btn btn-primary btn-block" type="submit">Create player ${ICON.plus}</button>
    </form>
  `);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const teamId = fd.get("team");
    const id = await DB.addPlayer({ name: fd.get("name"), role: fd.get("role"), team: teamId, avg: 0, sr: 0, hs: 0, bowlAvg: null, economy: null });
    const team = teamById(await DB.getState(), teamId);
    team.squad.push(id);
    DB._emit();
    toast("Player created and added to squad.");
    form.reset();
  });
  return form;
}

function formScheduleMatch(state) {
  const form = el(`
    <form class="glass-card">
      <div class="field-row">
        <div class="field"><label>Team A</label><select name="teamA">${state.teams.map((t) => `<option value="${t.id}">${t.name}</option>`).join("")}</select></div>
        <div class="field"><label>Team B</label><select name="teamB">${state.teams.map((t) => `<option value="${t.id}">${t.name}</option>`).join("")}</select></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Overs</label><input name="overs" type="number" value="20" min="1" /></div>
        <div class="field"><label>Tournament</label><select name="tournament">${state.tournaments.map((t) => `<option value="${t.id}">${t.name}</option>`).join("")}</select></div>
      </div>
      <div class="field"><label>Venue</label><input name="venue" placeholder="Stadium name" required /></div>
      <button class="btn btn-primary btn-block" type="submit">Schedule match ${ICON.plus}</button>
    </form>
  `);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    await DB.addMatch({ teamA: fd.get("teamA"), teamB: fd.get("teamB"), overs: Number(fd.get("overs")), tournament: fd.get("tournament"), venue: fd.get("venue"), status: "upcoming", startTime: Date.now(), innings: [] });
    toast("Match scheduled.");
    form.reset();
  });
  return form;
}

/* ---------------- ADMIN: BALL-BY-BALL SCORING CONSOLE ---------------- */
async function renderAdminScore(state, matchId) {
  const match = state.matches.find((m) => m.id === matchId);
  if (!match) return el(`<div class="empty-state">Match not found.</div>`);

  if (!match.innings.length) return tossScreen(match);

  const wrap = el(`<div></div>`);
  const inn = ensureInnings(match);
  const battingTeam = teamById(state, inn.battingTeam);
  const bowlingTeam = teamById(state, inn.bowlingTeam);

  wrap.appendChild(el(`
    <div class="glass-card score-hero">
      <span class="status-banner">${match.status === "completed" ? "MATCH OVER" : "SCORING · LIVE"}</span>
      <div class="teams-line">${battingTeam.name} batting</div>
      <div class="score-big">${inn.runs}<span style="color:var(--text-faint)">/${inn.wickets}</span></div>
      <div class="score-overs">Overs ${fmtOvers(inn.legalBalls)} / ${match.overs}</div>
    </div>
  `));

  wrap.appendChild(el(`<div class="glass-card" style="margin-top:12px"><div class="ball-strip">${(inn.thisOver.length ? inn.thisOver : ["—"]).map(ballChip).join("")}</div></div>`));

  const batWrap = el(`<div class="grid-2" style="margin-top:12px"></div>`);
  [inn.strikerId, inn.nonStrikerId].forEach((bid) => {
    const b = findB(inn, bid);
    batWrap.appendChild(el(`<div class="stat-box"><b>${b.runs} (${b.balls})</b><span>${b.name}${bid === inn.strikerId ? " *" : ""}</span></div>`));
  });
  wrap.appendChild(batWrap);
  const bowler = findBw(inn, inn.bowlerId);
  wrap.appendChild(el(`<div class="stat-box" style="margin-top:10px"><b>${fmtOvers(bowler.legalBalls)}-${bowler.runs}-${bowler.wickets}</b><span>${bowler.name} bowling</span></div>`));

  if (match.status === "completed") {
    wrap.appendChild(el(`<div class="glass-card" style="margin-top:14px;text-align:center"><b>${match.result}</b></div>`));
    wrap.appendChild(el(`<a href="#/live/${match.id}" class="btn btn-outline btn-block" style="margin-top:12px">View full scorecard</a>`));
    return wrap;
  }

  const controls = el(`<div style="margin-top:16px;display:flex;flex-direction:column;gap:10px"></div>`);
  wrap.appendChild(controls);

  function refresh() { renderRoute(); }

  if (inn.awaitingNewBatsman) {
    controls.appendChild(promptForm("Wicket! Who's coming in to bat?", "Batsman name", async (name) => {
      pushUndo(match.id, match);
      await DB.updateMatch(match.id, (m) => newBatsman(m, name));
    }));
  } else if (inn.awaitingNewBowler) {
    controls.appendChild(promptForm("Over complete — who's bowling next?", "Bowler name", async (name) => {
      pushUndo(match.id, match);
      await DB.updateMatch(match.id, (m) => newBowler(m, name));
    }));
  } else {
    const runGrid = el(`<div class="fab-run-grid"></div>`);
    [0, 1, 2, 3, 4, 6].forEach((r) => {
      const btn = el(`<button type="button" class="run-btn ${r === 4 ? "four" : r === 6 ? "six" : ""}">${r}</button>`);
      btn.addEventListener("click", async () => { pushUndo(match.id, match); await DB.updateMatch(match.id, (m) => addRun(m, r)); });
      runGrid.appendChild(btn);
    });
    controls.appendChild(runGrid);

    const extraGrid = el(`<div class="grid-2" style="grid-template-columns:repeat(4,1fr);gap:8px"></div>`);
    [["Wide", "wide"], ["No ball", "noball"], ["Bye", "bye"], ["Leg bye", "legbye"]].forEach(([label, kind]) => {
      const btn = el(`<button type="button" class="btn btn-outline btn-sm">${label}</button>`);
      btn.addEventListener("click", async () => {
        let runs = 1;
        if (kind === "bye" || kind === "legbye") {
          runs = Number(prompt(`${label} runs?`, "1")) || 1;
        }
        pushUndo(match.id, match);
        await DB.updateMatch(match.id, (m) => addExtra(m, kind, runs));
      });
      extraGrid.appendChild(btn);
    });
    controls.appendChild(extraGrid);

    const wicketBtn = el(`<button type="button" class="btn btn-danger btn-block">Wicket</button>`);
    wicketBtn.addEventListener("click", () => controls.appendChild(howOutForm(match)));
    controls.appendChild(wicketBtn);

    const row = el(`<div class="grid-2"></div>`);
    const undoBtn = el(`<button type="button" class="btn btn-ghost btn-block">Undo last ball</button>`);
    undoBtn.disabled = !(undoStacks[match.id] && undoStacks[match.id].length);
    undoBtn.addEventListener("click", async () => {
      const prevMatch = popUndo(match.id);
      if (!prevMatch) return;
      await DB.updateMatch(match.id, (m) => Object.assign(m, prevMatch));
    });
    const endBtn = el(`<button type="button" class="btn btn-outline btn-block">End innings</button>`);
    endBtn.addEventListener("click", async () => {
      if (!confirm("End this innings now?")) return;
      pushUndo(match.id, match);
      await DB.updateMatch(match.id, (m) => {
        const ci = ensureInnings(m);
        if (m.currentInnings === 0) m.target = ci.runs + 1;
        else { m.status = "completed"; m.result = computeResult(m); }
      });
      if (match.currentInnings === 0) controls.appendChild(startInningsTwoForm(match));
    });
    row.appendChild(undoBtn); row.appendChild(endBtn);
    controls.appendChild(row);

    const editBtn = el(`<button type="button" class="btn btn-ghost btn-block">Edit score manually</button>`);
    editBtn.addEventListener("click", () => controls.appendChild(editScoreForm(match)));
    controls.appendChild(editBtn);

    const finishBtn = el(`<button type="button" class="btn btn-danger btn-block">Finish match</button>`);
    finishBtn.addEventListener("click", async () => {
      if (!confirm("Mark this match as finished?")) return;
      pushUndo(match.id, match);
      await DB.updateMatch(match.id, (m) => { m.status = "completed"; m.result = m.result || computeResult(m); });
    });
    controls.appendChild(finishBtn);
  }

  return wrap;
}

function promptForm(title, placeholder, onSubmit) {
  const form = el(`
    <form class="glass-card">
      <div style="font-weight:700;font-size:13.5px;margin-bottom:10px">${title}</div>
      <div class="field"><input name="val" required placeholder="${placeholder}" /></div>
      <button class="btn btn-primary btn-block" type="submit">Confirm</button>
    </form>
  `);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const v = new FormData(form).get("val");
    if (v) onSubmit(v);
  });
  return form;
}

function howOutForm(match) {
  const modes = ["Bowled", "Caught", "LBW", "Run out", "Stumped", "Hit wicket"];
  const box = el(`
    <div class="glass-card">
      <div style="font-weight:700;font-size:13.5px;margin-bottom:10px">How out?</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">${modes.map((m) => `<button type="button" class="btn btn-outline btn-sm" data-how="${m}">${m}</button>`).join("")}</div>
    </div>
  `);
  box.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-how]");
    if (!b) return;
    pushUndo(match.id, match);
    await DB.updateMatch(match.id, (m) => addWicket(m, b.dataset.how));
  });
  return box;
}

function startInningsTwoForm(match) {
  const form = el(`
    <form class="glass-card">
      <div style="font-weight:700;font-size:13.5px;margin-bottom:10px">Start 2nd innings — target ${match.target}</div>
      <div class="field-row">
        <div class="field"><input name="striker" required placeholder="Striker" /></div>
        <div class="field"><input name="nonStriker" required placeholder="Non-striker" /></div>
      </div>
      <div class="field"><input name="bowler" required placeholder="Opening bowler" /></div>
      <button class="btn btn-primary btn-block" type="submit">Begin innings</button>
    </form>
  `);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    await DB.updateMatch(match.id, (m) => startSecondInnings(m, fd.get("striker"), fd.get("nonStriker"), fd.get("bowler")));
  });
  return form;
}

function editScoreForm(match) {
  const inn = ensureInnings(match);
  const form = el(`
    <form class="glass-card">
      <div style="font-weight:700;font-size:13.5px;margin-bottom:10px">Edit score manually</div>
      <div class="field-row">
        <div class="field"><label>Runs</label><input name="runs" type="number" value="${inn.runs}" /></div>
        <div class="field"><label>Wickets</label><input name="wickets" type="number" value="${inn.wickets}" min="0" max="10" /></div>
      </div>
      <div class="field"><label>Overs (e.g. 12.4)</label><input name="overs" value="${fmtOvers(inn.legalBalls)}" /></div>
      <button class="btn btn-primary btn-block" type="submit">Save changes</button>
    </form>
  `);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const [ov, ba] = String(fd.get("overs")).split(".").map(Number);
    pushUndo(match.id, match);
    await DB.updateMatch(match.id, (m) => {
      const ci = ensureInnings(m);
      ci.runs = Number(fd.get("runs"));
      ci.wickets = Number(fd.get("wickets"));
      ci.legalBalls = (ov || 0) * 6 + (ba || 0);
    });
    toast("Score updated.");
  });
  return form;
}

function tossScreen(match) {
  const wrap = el(`<div></div>`);
  const teamAName = match.teamA, teamBName = match.teamB;
  const form = el(`
    <form class="glass-card">
      <div style="font-weight:700;font-size:15px;margin-bottom:12px">Toss</div>
      <div class="field"><label>Toss won by</label>
        <select name="winner"><option value="${match.teamA}">Team A</option><option value="${match.teamB}">Team B</option></select>
      </div>
      <div class="field"><label>Decision</label>
        <select name="decision"><option value="bat">Bat first</option><option value="bowl">Bowl first</option></select>
      </div>
      <div class="field-row">
        <div class="field"><input name="striker" required placeholder="Striker name" /></div>
        <div class="field"><input name="nonStriker" required placeholder="Non-striker name" /></div>
      </div>
      <div class="field"><input name="bowler" required placeholder="Opening bowler name" /></div>
      <button class="btn btn-primary btn-block" type="submit">Start match ${ICON.bolt}</button>
    </form>
  `);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const winner = fd.get("winner");
    const decision = fd.get("decision");
    const battingTeam = decision === "bat" ? winner : (winner === match.teamA ? match.teamB : match.teamA);
    const bowlingTeam = battingTeam === match.teamA ? match.teamB : match.teamA;
    await DB.updateMatch(match.id, (m) => {
      m.toss = { winner, decision };
      m.status = "live";
      const striker = { id: "b_" + Math.random().toString(36).slice(2, 8), name: fd.get("striker"), runs: 0, balls: 0, fours: 0, sixes: 0, out: false, how: "" };
      const nonStriker = { id: "b_" + Math.random().toString(36).slice(2, 8), name: fd.get("nonStriker"), runs: 0, balls: 0, fours: 0, sixes: 0, out: false, how: "" };
      const bwl = { id: "bw_" + Math.random().toString(36).slice(2, 8), name: fd.get("bowler"), legalBalls: 0, runs: 0, wickets: 0, maidens: 0 };
      m.innings = [{
        battingTeam, bowlingTeam, runs: 0, wickets: 0, legalBalls: 0,
        extras: { wide: 0, noball: 0, bye: 0, legbye: 0 },
        batsmen: [striker, nonStriker], strikerId: striker.id, nonStrikerId: nonStriker.id,
        bowlers: [bwl], bowlerId: bwl.id,
        fallOfWickets: [], thisOver: [], partnership: { runs: 0, balls: 0 },
        awaitingNewBatsman: false, awaitingNewBowler: false,
      }];
      m.currentInnings = 0;
    });
  });
  wrap.appendChild(form);
  return wrap;
}

registerRoute("live", renderLive);
registerRoute("admin", renderAdmin);
