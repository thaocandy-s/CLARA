export const RADAR_KEYS = [
  "long_term_goals",
  "core_values",
  "communication",
  "lifestyle_habits",
  "interests",
  "finances",
  "future_plans",
] as const;

export type RadarKey = (typeof RADAR_KEYS)[number];

export const DEFAULT_WEIGHTS = [
  { key: "long_term_goals", label: "Mục tiêu dài hạn & Kế hoạch tương lai", value: 90 },
  { key: "core_values", label: "Giá trị sống & Đạo đức cốt lõi", value: 85 },
  { key: "communication", label: "Giao tiếp & Cân bằng cảm xúc", value: 80 },
  { key: "lifestyle_habits", label: "Lối sống & Thói quen sinh hoạt", value: 70 },
  { key: "interests", label: "Sở thích giải trí & Hoạt động chung", value: 60 },
];

export const ALLOWED_WEIGHT_KEYS = new Set<string>(RADAR_KEYS);
