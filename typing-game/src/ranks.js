export const RANKS = [
  { min: 0, title: "Ink Apprentice", icon: "🪶" },
  { min: 20, title: "Junior Clerk", icon: "📎" },
  { min: 40, title: "Journeyman Typist", icon: "🖋️" },
  { min: 60, title: "Senior Scribe", icon: "📜" },
  { min: 80, title: "Master Wordsmith", icon: "🏅" },
  { min: 100, title: "Ink Baron", icon: "👑" },
  { min: 130, title: "Legendary Compositor", icon: "⚡" },
];

export function getRank(wpm) {
  let current = RANKS[0];
  for (const rank of RANKS) {
    if (wpm >= rank.min) current = rank;
  }
  return current;
}

export function getNextRank(wpm) {
  return RANKS.find((rank) => rank.min > wpm) || null;
}
