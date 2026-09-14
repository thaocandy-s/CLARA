import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { apiJson } from "../api/client";
import type { Candidate, ChatMessage, Note, UserProfile } from "../types";
import { useAuth } from "./AuthContext";
import { useLocale } from "./LocaleContext";

interface AppState {
  candidates: Candidate[];
  userProfile: UserProfile;
  ready: boolean;
  getCandidate: (id: string) => Candidate | undefined;
  replaceCandidate: (candidate: Candidate) => void;
  addNote: (candidateId: string, text: string) => Promise<Note | null>;
  recalculate: (candidateId: string) => Promise<Candidate | null>;
  appendChatMessage: (candidateId: string, message: ChatMessage) => void;
  sendChat: (candidateId: string, text: string) => Promise<void>;
  clearChat: (candidateId: string) => Promise<void>;
  analyze: (candidateId: string) => Promise<Candidate | null>;
  saveExploring: (candidateId: string) => Promise<void>;
  matchCandidate: (candidateId: string) => Promise<void>;
  archiveCandidate: (candidateId: string) => Promise<void>;
  updateWeights: (weights: UserProfile["weights"]) => void;
  saveCriteria: (input: {
    weights: UserProfile["weights"];
    dealBreakerFlags: { no_smoking: boolean; long_term: boolean; pet_friendly: boolean };
  }) => Promise<boolean>;
  savePrivacy: (privacy: { incognito: boolean; hideFromPartner: boolean; noTraining: boolean }) => Promise<boolean>;
  deleteHistory: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

const emptyProfile: UserProfile = {
  name: "",
  age: 0,
  city: "",
  intent: "",
  dealBreakers: [],
  weights: [],
};

const AppStateContext = createContext<AppState | null>(null);

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, ready: authReady } = useAuth();
  const { locale } = useLocale();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(emptyProfile);
  const [ready, setReady] = useState(false);

  const replaceCandidate = useCallback((candidate: Candidate) => {
    setCandidates((prev) => {
      const exists = prev.some((c) => c.id === candidate.id);
      return exists ? prev.map((c) => (c.id === candidate.id ? candidate : c)) : [...prev, candidate];
    });
  }, []);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setCandidates([]);
      setReady(true);
      return;
    }
    const [listRes, criteriaRes] = await Promise.all([
      apiJson("/api/candidates"),
      apiJson("/api/me/criteria"),
    ]);
    if (listRes.ok) {
      const data = (await listRes.json()) as { items: Candidate[] };
      const missing = data.items.filter((c) => c.dataCompleteness === 0);
      if (missing.length) {
        await Promise.all(
          missing.map((c) =>
            apiJson("/api/clara/analyze", {
              method: "POST",
              body: JSON.stringify({ candidateId: c.id }),
            })
          )
        );
        const again = await apiJson("/api/candidates");
        if (again.ok) {
          setCandidates(((await again.json()) as { items: Candidate[] }).items);
        } else {
          setCandidates(data.items);
        }
      } else {
        setCandidates(data.items);
      }
    }
    if (criteriaRes.ok) {
      const criteria = (await criteriaRes.json()) as UserProfile & { dealBreakers: string[] };
      setUserProfile({
        name: criteria.name,
        age: criteria.age ?? 0,
        city: criteria.city ?? "",
        intent: criteria.intent ?? "",
        dealBreakers: criteria.dealBreakers ?? [],
        weights: criteria.weights ?? [],
      });
    }
    setReady(true);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authReady) return;
    void refresh();
  }, [authReady, refresh, locale]);

  const getCandidate = useCallback(
    (id: string) => candidates.find((c) => c.id === id),
    [candidates]
  );

  const addNote = useCallback(async (candidateId: string, text: string) => {
    if (!text.trim()) return null;
    const res = await apiJson(`/api/explorations/${candidateId}/notes`, {
      method: "POST",
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return null;
    const note = (await res.json()) as Note;
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, notes: [note, ...c.notes] } : c))
    );
    return note;
  }, []);

  const recalculate = useCallback(async (candidateId: string) => {
    const res = await apiJson("/api/clara/reanalyze", {
      method: "POST",
      body: JSON.stringify({ candidateId }),
    });
    if (!res.ok) return null;
    const candidate = (await res.json()) as Candidate;
    replaceCandidate(candidate);
    return candidate;
  }, [replaceCandidate]);

  const appendChatMessage = useCallback((candidateId: string, message: ChatMessage) => {
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === candidateId ? { ...c, chatHistory: [...c.chatHistory, message] } : c
      )
    );
  }, []);

  const sendChat = useCallback(
    async (candidateId: string, text: string) => {
      const res = await apiJson("/api/clara/chat", {
        method: "POST",
        body: JSON.stringify({ candidateId, text }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { userMessage: ChatMessage; agentMessage: ChatMessage };
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidateId
            ? { ...c, chatHistory: [...c.chatHistory, data.userMessage, data.agentMessage] }
            : c
        )
      );
    },
    []
  );

  const clearChat = useCallback(async (candidateId: string) => {
    const res = await apiJson(`/api/clara/chat/${candidateId}`, { method: "DELETE" });
    if (!res.ok) return;
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, chatHistory: [] } : c))
    );
  }, []);

  const analyze = useCallback(
    async (candidateId: string) => {
      const res = await apiJson("/api/clara/analyze", {
        method: "POST",
        body: JSON.stringify({ candidateId }),
      });
      if (!res.ok) return null;
      const candidate = (await res.json()) as Candidate;
      replaceCandidate(candidate);
      return candidate;
    },
    [replaceCandidate]
  );

  const saveExploring = useCallback(async (candidateId: string) => {
    await apiJson(`/api/explorations/${candidateId}`, { method: "POST" });
  }, []);

  const matchCandidate = useCallback(async (candidateId: string) => {
    const res = await apiJson(`/api/explorations/${candidateId}/match`, { method: "POST" });
    if (!res.ok) return;
    const data = (await res.json()) as { stage: Candidate["stage"] };
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, stage: data.stage } : c))
    );
  }, []);

  const archiveCandidate = useCallback(async (candidateId: string) => {
    const res = await apiJson(`/api/explorations/${candidateId}/archive`, { method: "POST" });
    if (!res.ok) return;
    const data = (await res.json()) as { stage: Candidate["stage"] };
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, stage: data.stage } : c))
    );
  }, []);

  const updateWeights = useCallback((weights: UserProfile["weights"]) => {
    setUserProfile((prev) => ({ ...prev, weights }));
  }, []);

  const saveCriteria = useCallback(
    async (input: {
      weights: UserProfile["weights"];
      dealBreakerFlags: { no_smoking: boolean; long_term: boolean; pet_friendly: boolean };
    }) => {
      const res = await apiJson("/api/me/criteria", {
        method: "PUT",
        body: JSON.stringify(input),
      });
      if (!res.ok) return false;
      const saved = (await res.json()) as UserProfile;
      setUserProfile((prev) => ({
        ...prev,
        dealBreakers: saved.dealBreakers,
        weights: saved.weights,
      }));
      return true;
    },
    []
  );

  const savePrivacy = useCallback(
    async (privacy: { incognito: boolean; hideFromPartner: boolean; noTraining: boolean }) => {
      const res = await apiJson("/api/me/privacy", {
        method: "PUT",
        body: JSON.stringify(privacy),
      });
      return res.ok;
    },
    []
  );

  const deleteHistory = useCallback(async () => {
    const res = await apiJson("/api/me/analysis-history", { method: "DELETE" });
    if (!res.ok) return false;
    await refresh();
    return true;
  }, [refresh]);

  const value = useMemo(
    () => ({
      candidates,
      userProfile,
      ready,
      getCandidate,
      replaceCandidate,
      addNote,
      recalculate,
      appendChatMessage,
      sendChat,
      clearChat,
      analyze,
      saveExploring,
      matchCandidate,
      archiveCandidate,
      updateWeights,
      saveCriteria,
      savePrivacy,
      deleteHistory,
      refresh,
    }),
    [
      candidates,
      userProfile,
      ready,
      getCandidate,
      replaceCandidate,
      addNote,
      recalculate,
      appendChatMessage,
      sendChat,
      clearChat,
      analyze,
      saveExploring,
      matchCandidate,
      archiveCandidate,
      updateWeights,
      saveCriteria,
      savePrivacy,
      deleteHistory,
      refresh,
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
};

export const useAppState = () => {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
};
