export interface RadarAxis {
  key: string;
  label: string;
  value: number;
}

export type ChecklistTone = "matched" | "check" | "friction";

export interface ChecklistItem {
  title: string;
  detail: string;
  sourceEvidence: string;
  tag?: string;
}

export interface Checklist {
  matched: ChecklistItem[];
  needsCheck: ChecklistItem[];
  potentialFriction: ChecklistItem[];
}

export interface CompareRow {
  label: string;
  userValue: string;
  targetValue: string;
  needsConfirmation?: boolean;
}

export type DatingStage =
  | "matched"
  | "chatting"
  | "met-once"
  | "archived";

export interface Note {
  id: string;
  timeLabel: string;
  author: "user" | "system";
  text: string;
}

export interface ChatRecommendation {
  title: string;
  items: string[];
}

export interface ChatMessage {
  id: string;
  sender: "agent" | "user";
  text: string;
  recommendation?: ChatRecommendation;
}

export interface Candidate {
  id: string;
  name: string;
  age: number;
  job: string;
  location: string;
  distanceKm: number;
  bio: string;
  tags: string[];
  gradient: string;
  overallCompatibility: number;
  dataCompleteness: number;
  confidenceLabel: string;
  matchLabel: string;
  matchBadgeTone: "match" | "check";
  aiQuickSummary: { positive: string; question: string };
  compareRows: CompareRow[];
  radarAxes: RadarAxis[];
  checklist: Checklist;
  icebreakers: string[];
  probingQuestions: string[];
  chatHistory: ChatMessage[];
  stage: DatingStage;
  stageLabel: string;
  savedLabel: string;
  notes: Note[];
  nextDatePlan: { title: string; detail: string };
}

export interface UserProfile {
  name: string;
  age: number;
  city: string;
  intent: string;
  dealBreakers: string[];
  weights: RadarAxis[];
}
