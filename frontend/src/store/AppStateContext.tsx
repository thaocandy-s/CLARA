import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { candidates as candidatesVi, userProfile as userProfileVi } from "../mock/data";
import { candidatesJa, userProfileJa } from "../mock/data.ja";
import type { Candidate, ChatMessage, Note, UserProfile } from "../types";
import { useLocale } from "./LocaleContext";

interface AppState {
  candidates: Candidate[];
  userProfile: UserProfile;
  getCandidate: (id: string) => Candidate | undefined;
  addNote: (candidateId: string, text: string) => void;
  recalculate: (candidateId: string) => void;
  appendChatMessage: (candidateId: string, message: ChatMessage) => void;
  updateWeights: (weights: UserProfile["weights"]) => void;
}

const AppStateContext = createContext<AppState | null>(null);

let noteCounter = 100;
let messageCounter = 100;

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const { locale, strings } = useLocale();
  const [candidates, setCandidates] = useState<Candidate[]>(candidatesVi);
  const [userProfile, setUserProfile] = useState<UserProfile>(userProfileVi);

  useEffect(() => {
    setCandidates(locale === "ja" ? candidatesJa : candidatesVi);
    setUserProfile(locale === "ja" ? userProfileJa : userProfileVi);
  }, [locale]);

  const getCandidate = useCallback(
    (id: string) => candidates.find((c) => c.id === id),
    [candidates]
  );

  const addNote = useCallback(
    (candidateId: string, text: string) => {
      if (!text.trim()) return;
      const note: Note = {
        id: `note-${noteCounter++}`,
        timeLabel: strings.myAnalyses.justNowNote,
        author: "user",
        text,
      };
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidateId ? { ...c, notes: [note, ...c.notes] } : c
        )
      );
    },
    [strings]
  );

  const recalculate = useCallback((candidateId: string) => {
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === candidateId
          ? { ...c, dataCompleteness: Math.min(98, c.dataCompleteness + 14) }
          : c
      )
    );
  }, []);

  const appendChatMessage = useCallback((candidateId: string, message: ChatMessage) => {
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === candidateId
          ? { ...c, chatHistory: [...c.chatHistory, { ...message, id: message.id ?? `msg-${messageCounter++}` }] }
          : c
      )
    );
  }, []);

  const updateWeights = useCallback((weights: UserProfile["weights"]) => {
    setUserProfile((prev) => ({ ...prev, weights }));
  }, []);

  const value = useMemo(
    () => ({
      candidates,
      userProfile,
      getCandidate,
      addNote,
      recalculate,
      appendChatMessage,
      updateWeights,
    }),
    [candidates, userProfile, getCandidate, addNote, recalculate, appendChatMessage, updateWeights]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
};

export const useAppState = () => {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
};
