import "./style.css";
import { WORD_BANK, QUOTES } from "./words.js";
import { AVATARS } from "./avatars.js";
import { getRank, getNextRank } from "./ranks.js";
import { STAMPS } from "./stamps.js";
import { getProfile, recordResult, getHallOfFame, submitToHallOfFame } from "./players.js";
import { renderWpmSparkline } from "./chart.js";
import {
  playKeyClack,
  playErrorThud,
  playBell,
  playFanfare,
  setSoundEnabled,
  isSoundEnabled,
} from "./sound.js";

const app = document.getElementById("app");

app.innerHTML = `
  <div class="desk">
    <div class="masthead">
      <h1>Ink &amp; <span class="accent">Ivory</span></h1>
      <p>An antique typewriter speed test</p>
    </div>

    <div class="header-actions">
      <button class="icon-btn" id="sound-toggle" title="Toggle sound">🔊</button>
      <button class="icon-btn" id="stamp-album-btn" title="Stamp Album">🏅</button>
      <button class="icon-btn" id="hall-of-fame-btn" title="Hall of Fame">🏆</button>
    </div>

    <!-- SETUP SCREEN -->
    <div class="screen" id="screen-setup">
      <div class="panel">
        <h2 class="panel-title">Who's Typing Today?</h2>
        <div class="count-toggle">
          <button class="key-btn" data-count="1">Solo</button>
          <button class="key-btn" data-count="2">Two Players</button>
        </div>
        <div class="player-setup-grid" id="player-setup-grid"></div>

        <h3 class="panel-subtitle">Choose a Passage</h3>
        <div class="left-controls" style="display:flex; gap:8px; flex-wrap:wrap; justify-content:center;">
          <div class="mode-group">
            <span class="label">Time</span>
            <button class="key-btn" data-mode="time" data-value="15">15s</button>
            <button class="key-btn" data-mode="time" data-value="30">30s</button>
            <button class="key-btn" data-mode="time" data-value="60">60s</button>
          </div>
          <div class="mode-group">
            <span class="label">Words</span>
            <button class="key-btn" data-mode="words" data-value="25">25</button>
            <button class="key-btn" data-mode="words" data-value="50">50</button>
          </div>
          <div class="mode-group">
            <button class="key-btn" data-mode="quote" data-value="quote">Quote</button>
          </div>
          <div class="mode-group">
            <button class="key-btn" data-mode="daily" data-value="daily">📅 Daily Challenge</button>
          </div>
        </div>

        <button class="key-btn primary begin-btn" id="begin-btn">Begin Typing</button>
      </div>
    </div>

    <!-- GAME SCREEN -->
    <div class="screen" id="screen-game">
      <div class="panel">
        <div class="turn-banner" id="turn-banner"></div>

        <div class="toolbar">
          <div class="left-controls"></div>
          <div class="right-controls">
            <button class="icon-btn" id="quit-btn" title="Abandon and return to setup">✕</button>
          </div>
        </div>

        <div class="stats">
          <div class="stat">
            <span class="value" id="stat-time">--</span>
            <span class="caption" id="stat-time-label">Time</span>
          </div>
          <div class="stat">
            <span class="value" id="stat-wpm">0</span>
            <span class="caption">WPM</span>
          </div>
          <div class="stat">
            <span class="value" id="stat-acc">100%</span>
            <span class="caption">Accuracy</span>
          </div>
          <div class="stat">
            <span class="value" id="stat-err">0</span>
            <span class="caption">Errors</span>
          </div>
          <div class="stat">
            <span class="value" id="stat-combo">0</span>
            <span class="caption">Combo</span>
          </div>
        </div>

        <div class="ghost-hint" id="ghost-hint"></div>

        <div class="paper-wrap">
          <div class="carriage-rail">
            <div class="progress" id="progress-bar"></div>
            <div class="ghost-marker" id="ghost-marker"></div>
          </div>
          <div class="paper" id="paper">
            <div class="text-display" id="text-display"></div>
          </div>
        </div>
        <p class="type-hint">Click the paper and just start typing. Esc quits to setup.</p>
        <input class="hidden-input" id="hidden-input" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />
      </div>
    </div>

    <!-- HANDOFF SCREEN -->
    <div class="screen" id="screen-handoff">
      <div class="panel handoff-panel">
        <div class="handoff-avatar" id="handoff-avatar"></div>
        <h2 id="handoff-title"></h2>
        <div class="mini-stats" id="handoff-stats"></div>
        <p class="handoff-sub" id="handoff-sub"></p>
        <button class="key-btn primary" id="handoff-continue">Pass the Machine</button>
      </div>
    </div>

    <!-- RESULTS SCREEN -->
    <div class="screen" id="screen-results">
      <div class="panel">
        <div id="results-content"></div>
        <div class="result-actions">
          <button class="key-btn primary" id="again-btn">Roll New Paper</button>
          <button class="key-btn" id="new-setup-btn">New Setup</button>
        </div>
      </div>
    </div>

    <footer class="credit">Tap-tap-tap &mdash; brewed with coffee and old ink ribbons</footer>
  </div>

  <div class="overlay" id="modal-overlay">
    <div class="result-card modal-card" id="modal-card"></div>
  </div>

  <div class="confetti-layer" id="confetti-layer"></div>
`;

const els = {
  screens: {
    setup: document.getElementById("screen-setup"),
    game: document.getElementById("screen-game"),
    handoff: document.getElementById("screen-handoff"),
    results: document.getElementById("screen-results"),
  },
  playerSetupGrid: document.getElementById("player-setup-grid"),
  countButtons: Array.from(document.querySelectorAll("[data-count]")),
  modeButtons: Array.from(document.querySelectorAll("[data-mode]")),
  beginBtn: document.getElementById("begin-btn"),

  turnBanner: document.getElementById("turn-banner"),
  quitBtn: document.getElementById("quit-btn"),
  ghostHint: document.getElementById("ghost-hint"),
  textDisplay: document.getElementById("text-display"),
  hiddenInput: document.getElementById("hidden-input"),
  paper: document.getElementById("paper"),
  progressBar: document.getElementById("progress-bar"),
  ghostMarker: document.getElementById("ghost-marker"),
  statTime: document.getElementById("stat-time"),
  statTimeLabel: document.getElementById("stat-time-label"),
  statWpm: document.getElementById("stat-wpm"),
  statAcc: document.getElementById("stat-acc"),
  statErr: document.getElementById("stat-err"),
  statCombo: document.getElementById("stat-combo"),

  handoffAvatar: document.getElementById("handoff-avatar"),
  handoffTitle: document.getElementById("handoff-title"),
  handoffStats: document.getElementById("handoff-stats"),
  handoffSub: document.getElementById("handoff-sub"),
  handoffContinue: document.getElementById("handoff-continue"),

  resultsContent: document.getElementById("results-content"),
  againBtn: document.getElementById("again-btn"),
  newSetupBtn: document.getElementById("new-setup-btn"),

  soundToggle: document.getElementById("sound-toggle"),
  stampAlbumBtn: document.getElementById("stamp-album-btn"),
  hallOfFameBtn: document.getElementById("hall-of-fame-btn"),

  modalOverlay: document.getElementById("modal-overlay"),
  modalCard: document.getElementById("modal-card"),
  confettiLayer: document.getElementById("confetti-layer"),
};

// ---------------------------------------------------------------------------
// App-level state (screens, players, match setup)
// ---------------------------------------------------------------------------

const app_ = {
  screen: "setup",
  numPlayers: 1,
  players: [
    { name: "", avatar: AVATARS[0] },
    { name: "", avatar: AVATARS[1] },
  ],
  mode: "time",
  value: "15",
  activePlayerIndex: 0,
  matchText: "",
  results: [],
  player1Trail: [],
};

// Per-turn typing session state
const session = {
  text: "",
  charStates: [],
  running: false,
  startTime: null,
  finished: false,
  timerId: null,
  scrollOffset: 0,
  streak: 0,
  bestStreak: 0,
  ghostTrail: null,
};

function showScreen(name) {
  app_.screen = name;
  Object.entries(els.screens).forEach(([key, el]) => {
    el.classList.toggle("active", key === name);
  });
}

// ---------------------------------------------------------------------------
// Text generation
// ---------------------------------------------------------------------------

function shuffledWords(count) {
  const pool = [];
  while (pool.length < count) {
    pool.push(WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)]);
  }
  return pool.join(" ");
}

function dayOfYearIndex(len) {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return dayOfYear % len;
}

function generateText(mode, value) {
  if (mode === "time") return shuffledWords(220);
  if (mode === "words") return shuffledWords(Number(value));
  if (mode === "daily") return QUOTES[dayOfYearIndex(QUOTES.length)];
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

// ---------------------------------------------------------------------------
// Setup screen
// ---------------------------------------------------------------------------

function renderPlayerCards() {
  const cards = [];
  for (let i = 0; i < app_.numPlayers; i++) {
    const player = app_.players[i];
    const avatarButtons = AVATARS.map(
      (a) => `<button class="avatar-btn${a === player.avatar ? " selected" : ""}" data-player="${i}" data-avatar="${a}">${a}</button>`
    ).join("");
    cards.push(`
      <div class="player-card">
        <div class="player-card-label">Player ${i + 1}</div>
        <label class="name-field-label" for="name-input-${i}">&#9998; Type your name here</label>
        <input class="name-input" id="name-input-${i}" data-player="${i}" maxlength="16" placeholder="e.g. ${i === 0 ? "Ravi" : "Priya"}" value="${player.name}" />
        <div class="avatar-section-label">Choose Your Avatar</div>
        <div class="avatar-grid">${avatarButtons}</div>
      </div>
    `);
  }
  els.playerSetupGrid.innerHTML = cards.join("");

  els.playerSetupGrid.querySelectorAll(".name-input").forEach((input) => {
    input.addEventListener("input", (e) => {
      const idx = Number(e.target.dataset.player);
      app_.players[idx].name = e.target.value;
    });
    input.addEventListener("focus", (e) => e.target.select());
  });

  els.playerSetupGrid.querySelectorAll(".avatar-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.player);
      app_.players[idx].avatar = btn.dataset.avatar;
      renderPlayerCards();
    });
  });
}

function setActiveCountButton() {
  els.countButtons.forEach((btn) => btn.classList.toggle("active", Number(btn.dataset.count) === app_.numPlayers));
}

function setActiveModeButton() {
  els.modeButtons.forEach((btn) => {
    const isActive = btn.dataset.mode === app_.mode && (["quote", "daily"].includes(app_.mode) || btn.dataset.value === app_.value);
    btn.classList.toggle("active", isActive);
  });
}

els.countButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    app_.numPlayers = Number(btn.dataset.count);
    setActiveCountButton();
    renderPlayerCards();
  });
});

els.modeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    app_.mode = btn.dataset.mode;
    app_.value = btn.dataset.value;
    setActiveModeButton();
  });
});

els.beginBtn.addEventListener("click", () => {
  app_.players.forEach((p, i) => {
    if (!p.name || !p.name.trim()) p.name = `Player ${i + 1}`;
  });
  beginMatch();
});

// ---------------------------------------------------------------------------
// Match / turn orchestration
// ---------------------------------------------------------------------------

function beginMatch() {
  app_.matchText = generateText(app_.mode, app_.value);
  app_.activePlayerIndex = 0;
  app_.results = [];
  app_.player1Trail = [];
  showScreen("game");
  startTurn();
}

function currentPlayer() {
  return app_.players[app_.activePlayerIndex];
}

function updateTurnBanner() {
  if (app_.numPlayers === 1) {
    els.turnBanner.innerHTML = `<span class="turn-avatar">${currentPlayer().avatar}</span> ${currentPlayer().name}`;
    els.turnBanner.classList.remove("duel");
  } else {
    const label = app_.activePlayerIndex === 0 ? "Round 1" : "Round 2 — Beat the Ghost!";
    els.turnBanner.innerHTML = `<span class="turn-avatar">${currentPlayer().avatar}</span> ${currentPlayer().name}'s Turn <span class="turn-round">${label}</span>`;
    els.turnBanner.classList.add("duel");
  }
}

function startTurn() {
  updateTurnBanner();
  resetSession(app_.matchText);

  const isGhostTurn = app_.numPlayers === 2 && app_.activePlayerIndex === 1 && app_.player1Trail.length > 0;
  session.ghostTrail = isGhostTurn ? app_.player1Trail : null;
  els.ghostMarker.style.display = isGhostTurn ? "block" : "none";
  els.ghostHint.textContent = isGhostTurn ? `Racing against ${app_.players[0].name}'s pace \u{1F47B}` : "";
  els.ghostHint.style.visibility = isGhostTurn ? "visible" : "hidden";
}

function resetSession(text) {
  clearInterval(session.timerId);
  session.text = text;
  session.charStates = new Array(text.length).fill("pending");
  session.running = false;
  session.startTime = null;
  session.finished = false;
  session.streak = 0;
  session.bestStreak = 0;
  els.hiddenInput.value = "";
  els.hiddenInput.maxLength = text.length;
  els.progressBar.style.width = "0%";
  renderText();
  formatTimeLabel();
  updateStatsDisplay(0, 0, 100, 0, 0);
  els.hiddenInput.focus();
}

function formatTimeLabel() {
  els.statTimeLabel.textContent = app_.mode === "time" ? "Time Left" : "Elapsed";
}

function renderText() {
  els.textDisplay.innerHTML = session.text
    .split("")
    .map((ch, i) => `<span class="char${i === 0 ? " current" : ""}${ch === " " ? " space" : ""}" data-i="${i}">${ch}</span>`)
    .join("");
  session.scrollOffset = 0;
  els.textDisplay.style.transform = "translateY(0px)";
}

function updatePaperScroll(currentIndex) {
  const spans = els.textDisplay.children;
  const currentSpan = spans[Math.min(currentIndex, spans.length - 1)];
  if (!currentSpan) return;

  const firstTop = spans[0].offsetTop;
  let lineHeight = 0;
  for (let i = 1; i < spans.length; i++) {
    if (spans[i].offsetTop !== firstTop) {
      lineHeight = spans[i].offsetTop - firstTop;
      break;
    }
  }
  if (!lineHeight) return;

  const visibleHeight = els.paper.clientHeight - 54;
  const relativeTop = currentSpan.offsetTop - session.scrollOffset;

  if (relativeTop > visibleHeight - lineHeight) {
    session.scrollOffset = currentSpan.offsetTop - lineHeight;
    els.textDisplay.style.transform = `translateY(-${session.scrollOffset}px)`;
  } else if (relativeTop < 0) {
    session.scrollOffset = Math.max(0, currentSpan.offsetTop - lineHeight);
    els.textDisplay.style.transform = `translateY(-${session.scrollOffset}px)`;
  }
}

function updateStatsDisplay(seconds, wpm, accuracy, errors, combo) {
  if (app_.mode === "time") {
    const remaining = Math.max(0, Number(app_.value) - Math.floor(seconds));
    els.statTime.textContent = `${remaining}s`;
  } else {
    els.statTime.textContent = `${Math.floor(seconds)}s`;
  }
  els.statWpm.textContent = wpm;
  els.statAcc.textContent = `${accuracy}%`;
  els.statErr.textContent = errors;
  els.statCombo.textContent = combo >= 10 ? `${combo} \u{1F525}` : combo;
}

function computeLiveStats() {
  const now = Date.now();
  const elapsedSec = session.startTime ? (now - session.startTime) / 1000 : 0;
  const typedCount = els.hiddenInput.value.length;
  const correct = session.charStates.filter((s) => s === "correct").length;
  const minutes = Math.max(elapsedSec / 60, 1 / 60);
  const wpm = Math.round(correct / 5 / minutes) || 0;
  const accuracy = typedCount > 0 ? Math.round((correct / typedCount) * 100) : 100;
  return { elapsedSec, wpm, accuracy, typedCount, correct };
}

function updateGhostMarker(elapsedSec) {
  if (!session.ghostTrail || session.ghostTrail.length === 0) return;
  const elapsedMs = elapsedSec * 1000;
  let entry = session.ghostTrail[0];
  for (const t of session.ghostTrail) {
    if (t.t <= elapsedMs) entry = t;
    else break;
  }
  const ghostPct = Math.min(100, (entry.i / session.text.length) * 100);
  els.ghostMarker.style.left = `${ghostPct}%`;

  const ownPct = (els.hiddenInput.value.length / session.text.length) * 100;
  if (session.running) {
    if (ownPct > ghostPct + 1) {
      els.ghostHint.textContent = `You're ahead of ${app_.players[0].name}! \u{1F3C3}`;
    } else if (ownPct < ghostPct - 1) {
      els.ghostHint.textContent = `${app_.players[0].name} is pulling ahead! \u{1F4A8}`;
    } else {
      els.ghostHint.textContent = "Neck and neck!";
    }
  }
}

function tick() {
  const { elapsedSec, wpm, accuracy } = computeLiveStats();
  const incorrect = session.charStates.filter((s) => s === "incorrect").length;
  updateStatsDisplay(elapsedSec, wpm, accuracy, incorrect, session.streak);
  updateGhostMarker(elapsedSec);

  if (app_.mode === "time" && elapsedSec >= Number(app_.value)) {
    finishTurn();
  }
}

function startTimerIfNeeded() {
  if (session.running) return;
  session.running = true;
  session.startTime = Date.now();
  session.timerId = setInterval(tick, 200);
}

function applyCharStatesToDom() {
  const spans = els.textDisplay.children;
  for (let i = 0; i < session.text.length; i++) {
    const span = spans[i];
    span.classList.remove("correct", "incorrect", "current");
    if (session.charStates[i] === "correct") span.classList.add("correct");
    else if (session.charStates[i] === "incorrect") span.classList.add("incorrect");
  }
  const currentIndex = els.hiddenInput.value.length;
  if (currentIndex < session.text.length) {
    spans[currentIndex].classList.add("current");
  }
  updatePaperScroll(currentIndex);
}

function handleInput() {
  if (session.finished) return;
  const typed = els.hiddenInput.value;

  if (!session.running && typed.length > 0) {
    startTimerIfNeeded();
  }

  let newlyCorrect = false;
  let newlyIncorrect = false;
  for (let i = 0; i < session.text.length; i++) {
    if (i < typed.length) {
      const isMatch = typed[i] === session.text[i];
      const prevState = session.charStates[i];
      session.charStates[i] = isMatch ? "correct" : "incorrect";
      if (i === typed.length - 1 && prevState === "pending") {
        if (isMatch) newlyCorrect = true;
        else newlyIncorrect = true;
      }
    } else {
      session.charStates[i] = "pending";
    }
  }

  if (newlyIncorrect) {
    playErrorThud();
    session.streak = 0;
  } else if (newlyCorrect) {
    playKeyClack();
    session.streak++;
    session.bestStreak = Math.max(session.bestStreak, session.streak);
  }

  if (app_.numPlayers === 2 && app_.activePlayerIndex === 0 && session.startTime) {
    app_.player1Trail.push({ t: Date.now() - session.startTime, i: typed.length });
  }

  applyCharStatesToDom();
  els.progressBar.style.width = `${Math.min(100, (typed.length / session.text.length) * 100)}%`;

  const { elapsedSec, wpm, accuracy } = computeLiveStats();
  const incorrect = session.charStates.filter((s) => s === "incorrect").length;
  updateStatsDisplay(elapsedSec, wpm, accuracy, incorrect, session.streak);

  if ((app_.mode === "words" || app_.mode === "quote" || app_.mode === "daily") && typed.length >= session.text.length) {
    finishTurn();
  }
}

function ejectPaper() {
  return new Promise((resolve) => {
    els.paper.classList.add("eject");
    setTimeout(() => {
      els.paper.classList.remove("eject");
      resolve();
    }, 420);
  });
}

async function finishTurn() {
  if (session.finished) return;
  session.finished = true;
  session.running = false;
  clearInterval(session.timerId);
  els.hiddenInput.blur();

  const { elapsedSec, accuracy, correct, typedCount } = computeLiveStats();
  const minutes = Math.max(elapsedSec / 60, 1 / 60);
  const wpm = Math.round(correct / 5 / minutes) || 0;
  const rawWpm = Math.round(typedCount / 5 / minutes) || 0;

  const result = {
    wpm,
    accuracy,
    rawWpm,
    elapsedSec: Math.round(elapsedSec),
    mode: app_.mode,
    value: app_.value,
    bestStreak: session.bestStreak,
  };

  playBell();
  await ejectPaper();

  app_.results[app_.activePlayerIndex] = result;

  if (app_.numPlayers === 2 && app_.activePlayerIndex === 0) {
    showHandoff(result);
  } else {
    finalizeMatch();
  }
}

// ---------------------------------------------------------------------------
// Handoff screen (between duo turns)
// ---------------------------------------------------------------------------

function showHandoff(result) {
  const player = app_.players[0];
  const nextPlayer = app_.players[1];
  els.handoffAvatar.textContent = player.avatar;
  els.handoffTitle.textContent = `Nicely typed, ${player.name}!`;
  els.handoffStats.innerHTML = `
    <div class="box"><div class="big">${result.wpm}</div><div class="small">WPM</div></div>
    <div class="box"><div class="big">${result.accuracy}%</div><div class="small">Accuracy</div></div>
  `;
  els.handoffSub.innerHTML = `Pass the machine to <strong>${nextPlayer.avatar} ${nextPlayer.name}</strong> — same passage, can they beat the ghost?`;
  showScreen("handoff");
}

els.handoffContinue.addEventListener("click", () => {
  app_.activePlayerIndex = 1;
  showScreen("game");
  startTurn();
});

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

function formatDelta(current, previous, unit = "") {
  if (previous === null || previous === undefined || Number.isNaN(previous)) {
    return `<span class="delta neutral">baseline</span>`;
  }
  const diff = current - previous;
  if (diff > 0) return `<span class="delta up">▲ +${diff}${unit}</span>`;
  if (diff < 0) return `<span class="delta down">▼ ${diff}${unit}</span>`;
  return `<span class="delta neutral">— even</span>`;
}

function renderRankBlock(wpm) {
  const rank = getRank(wpm);
  const next = getNextRank(wpm);
  const nextHint = next
    ? `<div class="rank-next">${next.min - wpm} more WPM to reach ${next.icon} ${next.title}</div>`
    : `<div class="rank-next">Top rank reached!</div>`;
  return `
    <div class="rank-block">
      <div class="rank-caption">Your Typing Rank</div>
      <div class="rank-badge">${rank.icon} ${rank.title}</div>
      ${nextHint}
    </div>
  `;
}

function renderStampStrip(newStamps) {
  if (!newStamps || newStamps.length === 0) return "";
  return `
    <div class="stamp-strip">
      <div class="stamp-strip-label">New Stamps Earned!</div>
      <div class="stamp-strip-icons">
        ${newStamps.map((s) => `<div class="stamp earned reveal" title="${s.name}: ${s.desc}"><span>${s.icon}</span><small>${s.name}</small></div>`).join("")}
      </div>
    </div>
  `;
}

function finalizeMatch() {
  if (app_.numPlayers === 1) {
    const player = app_.players[0];
    const prevProfile = getProfile(player.name);
    const prevHistory = prevProfile.history;
    const previousLast = prevHistory.length ? prevHistory[prevHistory.length - 1] : null;
    const previousAvg = prevHistory.length ? Math.round(prevHistory.reduce((s, h) => s + h.wpm, 0) / prevHistory.length) : null;

    const result = app_.results[0];
    const { history, newStamps } = recordResult(player.name, player.avatar, result);
    submitToHallOfFame({ name: player.name, avatar: player.avatar, wpm: result.wpm, accuracy: result.accuracy, mode: result.mode, value: result.value, date: Date.now() });

    if (newStamps.length > 0) {
      playFanfare();
      launchConfetti();
    }

    els.resultsContent.innerHTML = `
      <h2>Page Complete</h2>
      <div class="tag-line">— final tally for ${player.avatar} ${player.name} —</div>
      ${renderRankBlock(result.wpm)}
      <div class="result-grid">
        <div class="box"><div class="big">${result.wpm}</div><div class="small">WPM</div></div>
        <div class="box"><div class="big">${result.accuracy}%</div><div class="small">Accuracy</div></div>
        <div class="box"><div class="big">${result.rawWpm}</div><div class="small">Raw WPM</div></div>
        <div class="box"><div class="big">${result.elapsedSec}s</div><div class="small">Time Taken</div></div>
      </div>

      <div class="comparison-grid">
        <div class="comparison-box">
          <div class="comparison-title">vs Last Time</div>
          <div class="comparison-value">${previousLast ? previousLast.wpm + " WPM" : "—"}</div>
          ${formatDelta(result.wpm, previousLast ? previousLast.wpm : null, " wpm")}
        </div>
        <div class="comparison-box">
          <div class="comparison-title">vs Your Average</div>
          <div class="comparison-value">${previousAvg !== null ? previousAvg + " WPM" : "—"}</div>
          ${formatDelta(result.wpm, previousAvg, " wpm")}
        </div>
      </div>

      <div class="graph-box">
        <div class="comparison-title">Performance Over Time</div>
        ${renderWpmSparkline(history)}
      </div>

      ${renderStampStrip(newStamps)}
    `;
    showScreen("results");
  } else {
    const [r0, r1] = app_.results;
    const [p0, p1] = app_.players;
    let winnerIdx = null;
    if (r0.wpm > r1.wpm) winnerIdx = 0;
    else if (r1.wpm > r0.wpm) winnerIdx = 1;

    r0.wonDuel = winnerIdx === 0;
    r1.wonDuel = winnerIdx === 1;

    const rec0 = recordResult(p0.name, p0.avatar, r0);
    const rec1 = recordResult(p1.name, p1.avatar, r1);
    submitToHallOfFame({ name: p0.name, avatar: p0.avatar, wpm: r0.wpm, accuracy: r0.accuracy, mode: r0.mode, value: r0.value, date: Date.now() });
    submitToHallOfFame({ name: p1.name, avatar: p1.avatar, wpm: r1.wpm, accuracy: r1.accuracy, mode: r1.mode, value: r1.value, date: Date.now() });

    if (winnerIdx !== null || rec0.newStamps.length || rec1.newStamps.length) {
      playFanfare();
      launchConfetti();
    }

    const cardHtml = (player, result, isWinner) => `
      <div class="duel-card${isWinner ? " winner" : ""}">
        ${isWinner ? '<div class="crown">👑</div>' : ""}
        <div class="duel-avatar">${player.avatar}</div>
        <div class="duel-name">${player.name}</div>
        <div class="duel-rank" title="Typing rank based on WPM">${getRank(result.wpm).icon} ${getRank(result.wpm).title}</div>
        <div class="duel-stats">
          <div><span class="big">${result.wpm}</span><span class="small">WPM</span></div>
          <div><span class="big">${result.accuracy}%</span><span class="small">Accuracy</span></div>
        </div>
      </div>
    `;

    els.resultsContent.innerHTML = `
      <h2>${winnerIdx === null ? "It's a Tie!" : `${app_.players[winnerIdx].name} Wins!`}</h2>
      <div class="tag-line">— head to head —</div>
      <div class="duel-grid">
        ${cardHtml(p0, r0, winnerIdx === 0)}
        ${cardHtml(p1, r1, winnerIdx === 1)}
      </div>
      ${renderStampStrip([...rec0.newStamps, ...rec1.newStamps])}
    `;
    showScreen("results");
  }
}

els.againBtn.addEventListener("click", () => {
  beginMatch();
});

els.newSetupBtn.addEventListener("click", () => {
  showScreen("setup");
  setActiveCountButton();
  setActiveModeButton();
  renderPlayerCards();
});

// ---------------------------------------------------------------------------
// Quit mid-game
// ---------------------------------------------------------------------------

els.quitBtn.addEventListener("click", () => {
  clearInterval(session.timerId);
  showScreen("setup");
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && app_.screen === "game") {
    e.preventDefault();
    clearInterval(session.timerId);
    showScreen("setup");
  }
});

// ---------------------------------------------------------------------------
// Confetti
// ---------------------------------------------------------------------------

function launchConfetti() {
  const colors = ["#c9a25a", "#6f4e37", "#e8dcc0", "#a4342a", "#3f6b3f"];
  for (let i = 0; i < 26; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = `${Math.random() * 0.3}s`;
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    els.confettiLayer.appendChild(piece);
    setTimeout(() => piece.remove(), 2200);
  }
}

// ---------------------------------------------------------------------------
// Sound toggle
// ---------------------------------------------------------------------------

els.soundToggle.addEventListener("click", () => {
  setSoundEnabled(!isSoundEnabled());
  els.soundToggle.textContent = isSoundEnabled() ? "🔊" : "🔇";
});

// ---------------------------------------------------------------------------
// Modal (Stamp Album / Hall of Fame)
// ---------------------------------------------------------------------------

function openModal(html) {
  els.modalCard.innerHTML = html;
  els.modalOverlay.classList.add("show");
}

function closeModal() {
  els.modalOverlay.classList.remove("show");
}

els.modalOverlay.addEventListener("click", (e) => {
  if (e.target === els.modalOverlay) closeModal();
});

function renderStampAlbum(playerIdx) {
  const roster = app_.players.slice(0, Math.max(app_.numPlayers, 1));
  if (roster.every((p) => !p.name)) {
    return `<h2>Stamp Album</h2><p class="empty-hint">Play your first test to start collecting stamps!</p><button class="key-btn" id="modal-close">Close</button>`;
  }
  const player = roster[playerIdx] || roster[0];
  const profile = getProfile(player.name);
  const tabs = roster.length > 1
    ? `<div class="stamp-tabs">${roster.map((p, i) => `<button class="key-btn stamp-tab${i === playerIdx ? " active" : ""}" data-tab="${i}">${p.avatar} ${p.name}</button>`).join("")}</div>`
    : "";
  const grid = STAMPS.map((s) => {
    const earned = profile.stamps.includes(s.id);
    return `<div class="stamp ${earned ? "earned" : "locked"}" title="${s.desc}"><span>${earned ? s.icon : "🔒"}</span><small>${s.name}</small></div>`;
  }).join("");
  return `
    <h2>Stamp Album</h2>
    ${tabs}
    <div class="stamp-grid">${grid}</div>
    <button class="key-btn" id="modal-close">Close</button>
  `;
}

function wireStampAlbum(playerIdx) {
  const closeBtn = document.getElementById("modal-close");
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  els.modalCard.querySelectorAll(".stamp-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const idx = Number(tab.dataset.tab);
      openModal(renderStampAlbum(idx));
      wireStampAlbum(idx);
    });
  });
}

els.stampAlbumBtn.addEventListener("click", () => {
  openModal(renderStampAlbum(0));
  wireStampAlbum(0);
});

function renderHallOfFame() {
  const board = getHallOfFame();
  if (board.length === 0) {
    return `<h2>Hall of Fame</h2><p class="empty-hint">No legends yet — be the first to set a record!</p><button class="key-btn" id="modal-close">Close</button>`;
  }
  const rows = board
    .map(
      (entry, i) => `
      <div class="hof-row">
        <span class="hof-rank">${i + 1}</span>
        <span class="hof-avatar">${entry.avatar}</span>
        <span class="hof-name">${entry.name}</span>
        <span class="hof-wpm">${entry.wpm} wpm</span>
        <span class="hof-acc">${entry.accuracy}%</span>
      </div>`
    )
    .join("");
  return `
    <h2>Hall of Fame</h2>
    <div class="tag-line">— all-time top scores —</div>
    <div class="hof-list">${rows}</div>
    <button class="key-btn" id="modal-close">Close</button>
  `;
}

els.hallOfFameBtn.addEventListener("click", () => {
  openModal(renderHallOfFame());
  document.getElementById("modal-close").addEventListener("click", closeModal);
});

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

els.hiddenInput.addEventListener("input", handleInput);
els.paper.addEventListener("click", () => els.hiddenInput.focus());
document.addEventListener("click", (e) => {
  if (app_.screen === "game" && !els.modalOverlay.classList.contains("show") && e.target !== els.hiddenInput) {
    els.hiddenInput.focus();
  }
});

setActiveCountButton();
setActiveModeButton();
renderPlayerCards();
showScreen("setup");
