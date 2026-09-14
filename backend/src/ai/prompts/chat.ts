import type { AppLocale } from "../../shared/locale.js";
import { claraPersona } from "./clara-persona.js";

export type ChatPromptInput = {
  locale: AppLocale;
  userText: string;
  candidateName: string;
  overallCompatibility: number;
  icebreakers: string[];
  probingQuestions: string[];
  nextDatePlan: { title: string; detail: string };
  financeKnown: boolean;
  recentMessages: Array<{ sender: string; text: string }>;
  notes: string[];
};

export const chatSystemPrompt = (locale: AppLocale) =>
  [
    claraPersona(locale),
    "Workflow: coaching chat. Return JSON { text, recommendation?: { title, items } }.",
    "text may use <strong> and <br>. Do not push the user to Match.",
    "If they ask about money: suggest observing date venues; do not tell them to ask salary on date 1.",
    "If they ask for a date idea: public place, moderate duration.",
    "Ground icebreakers/questions in the provided analysis arrays.",
  ].join("\n");

export const chatUserPrompt = (input: ChatPromptInput) =>
  JSON.stringify({
    locale: input.locale,
    userText: input.userText,
    candidateName: input.candidateName,
    overallCompatibility: input.overallCompatibility,
    icebreakers: input.icebreakers,
    probingQuestions: input.probingQuestions,
    nextDatePlan: input.nextDatePlan,
    financeKnown: input.financeKnown,
    recentMessages: input.recentMessages,
    notes: input.notes,
  });
