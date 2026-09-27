export const STAMPS = [
  {
    id: "first-page",
    name: "First Page",
    desc: "Complete your very first test",
    icon: "📄",
    check: (result, history) => history.length === 1,
  },
  {
    id: "speed-demon",
    name: "Speed Demon",
    desc: "Reach 60 WPM",
    icon: "⚡",
    check: (result) => result.wpm >= 60,
  },
  {
    id: "century-club",
    name: "Century Club",
    desc: "Reach 100 WPM",
    icon: "💯",
    check: (result) => result.wpm >= 100,
  },
  {
    id: "sharpshooter",
    name: "Sharpshooter",
    desc: "Finish with 100% accuracy",
    icon: "🎯",
    check: (result) => result.accuracy === 100,
  },
  {
    id: "iron-fingers",
    name: "Iron Fingers",
    desc: "Finish the 60 second marathon",
    icon: "🖐️",
    check: (result) => result.mode === "time" && result.value === "60",
  },
  {
    id: "bookworm",
    name: "Bookworm",
    desc: "Complete a quote passage",
    icon: "📖",
    check: (result) => result.mode === "quote" || result.mode === "daily",
  },
  {
    id: "wordsmith",
    name: "Wordsmith",
    desc: "Complete the 50-word dash",
    icon: "🖋️",
    check: (result) => result.mode === "words" && result.value === "50",
  },
  {
    id: "personal-best",
    name: "Personal Best",
    desc: "Beat your previous best WPM",
    icon: "🏆",
    check: (result, history) => {
      if (history.length < 2) return false;
      const prevBest = Math.max(...history.slice(0, -1).map((h) => h.wpm));
      return result.wpm > prevBest;
    },
  },
  {
    id: "perfect-ten",
    name: "Perfect Ten",
    desc: "Complete 10 tests",
    icon: "🔟",
    check: (result, history) => history.length === 10,
  },
  {
    id: "duelist",
    name: "Duelist",
    desc: "Win a two-player match",
    icon: "⚔️",
    check: (result) => result.wonDuel === true,
  },
  {
    id: "streak-master",
    name: "Streak Master",
    desc: "Land a 30 keystroke combo",
    icon: "🔥",
    check: (result) => (result.bestStreak || 0) >= 30,
  },
];

export function evaluateNewStamps(result, history, existingIds) {
  const earned = [];
  for (const stamp of STAMPS) {
    if (existingIds.includes(stamp.id)) continue;
    if (stamp.check(result, history)) earned.push(stamp);
  }
  return earned;
}
