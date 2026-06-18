// Shared content + palettes used across tabs.

export const AFFIRMATIONS = [
  "You are exactly where you need to be. ✦",
  "Small steps, taken daily, become a life you love.",
  "Your pace is the right pace.",
  "You are allowed to grow slowly and still be proud.",
  "What you water, grows. Tend to yourself today.",
  "Rest is productive. So is joy.",
  "You don't have to do it all — just the next right thing.",
  "Your future self is cheering you on.",
  "Progress, not perfection. Always.",
  "You are becoming her, one gentle day at a time.",
];

// Goal categories shared by the Quarter and Year tabs.
export const GOAL_CATEGORIES = [
  "Finance",
  "Health",
  "Business",
  "Personal",
] as const;

export const BUCKET_CATEGORIES = [
  "Travel",
  "Experience",
  "Career",
  "Personal",
  "Health",
  "Creative",
  "Financial",
] as const;

export type BucketCategory = (typeof BUCKET_CATEGORIES)[number];

export const MONTH_QUESTIONS: { id: string; q: string }[] = [
  { id: "wins", q: "What were your biggest wins this month?" },
  { id: "challenge", q: "What was your biggest challenge and how did you handle it?" },
  { id: "grateful", q: "What are you most grateful for this month?" },
  { id: "learned", q: "What's the most important thing you learned?" },
  { id: "health", q: "How did you take care of your health — body and mind?" },
  { id: "growth", q: "How did you grow personally or professionally?" },
  { id: "differently", q: "What would you do differently next month?" },
  { id: "intention", q: "What's your intention going into next month?" },
];

// Emoji icon choices for habits.
export const HABIT_ICONS = [
  "🏋️", "🏃", "🧘", "💧", "📖", "✍️", "🙏", "📿",
  "🌱", "☀️", "💪", "🎯", "🛏️", "🥗", "🧠", "❤️",
];

// Warm palette for habit color-coding (base hex; tints derived with alpha).
export const HABIT_COLORS = [
  "#d68d84", // terracotta
  "#c2756c", // deep terracotta
  "#9fae8b", // sage
  "#c98b9a", // dusty rose
  "#cda875", // sand
  "#a98467", // clay brown
  "#8aa6a3", // sage blue
  "#a07d9c", // plum
];
