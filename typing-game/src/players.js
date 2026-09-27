import { evaluateNewStamps } from "./stamps.js";

const PROFILES_KEY = "inkAndIvory:profiles";
const HALL_OF_FAME_KEY = "inkAndIvory:hallOfFame";
const MAX_HISTORY = 20;
const MAX_HALL_OF_FAME = 5;

function safeParse(json, fallback) {
  try {
    const parsed = JSON.parse(json);
    return parsed || fallback;
  } catch (e) {
    return fallback;
  }
}

function loadProfiles() {
  return safeParse(localStorage.getItem(PROFILES_KEY), {});
}

function saveProfiles(profiles) {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  } catch (e) {
    /* storage unavailable, ignore */
  }
}

function keyFor(name) {
  return name.trim().toLowerCase();
}

export function getProfile(name) {
  const profiles = loadProfiles();
  const entry = profiles[keyFor(name)];
  if (!entry) return { history: [], stamps: [] };
  return { history: entry.history || [], stamps: entry.stamps || [] };
}

export function recordResult(name, avatar, result) {
  const profiles = loadProfiles();
  const key = keyFor(name);
  const existing = profiles[key] || { history: [], stamps: [] };

  const historyEntry = {
    date: Date.now(),
    wpm: result.wpm,
    accuracy: result.accuracy,
    rawWpm: result.rawWpm,
    mode: result.mode,
    value: result.value,
  };

  const history = [...existing.history, historyEntry].slice(-MAX_HISTORY);
  const newStamps = evaluateNewStamps(result, history, existing.stamps || []);
  const stamps = [...(existing.stamps || []), ...newStamps.map((s) => s.id)];

  profiles[key] = { displayName: name, avatar, history, stamps };
  saveProfiles(profiles);

  return { history, stamps, newStamps };
}

export function getHallOfFame() {
  return safeParse(localStorage.getItem(HALL_OF_FAME_KEY), []);
}

export function submitToHallOfFame(entry) {
  const board = getHallOfFame();
  board.push(entry);
  board.sort((a, b) => b.wpm - a.wpm);
  const trimmed = board.slice(0, MAX_HALL_OF_FAME);
  try {
    localStorage.setItem(HALL_OF_FAME_KEY, JSON.stringify(trimmed));
  } catch (e) {
    /* storage unavailable, ignore */
  }
  return trimmed;
}
