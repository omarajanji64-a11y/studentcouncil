"use client";

import { useState, useEffect, useMemo, createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { Break } from "@/lib/types";
import { useBreaks } from "@/hooks/use-firestore";
import { useAuth } from "@/hooks/use-auth";
import { isStaff } from "@/lib/permissions";

interface BreakStatus {
  activeBreak: Break | null;
  timeRemaining: number;
  isBreakActive: boolean;
  loading: boolean;
}

type BreaksContextValue = {
  breaks: Break[];
  loading: boolean;
  error: string | null;
};

const BreaksContext = createContext<BreaksContextValue | null>(null);

export function BreaksProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const realtime = isStaff(user);
  const { data: breaks, loading, error } = useBreaks({ enabled: !!user, realtime });
  const value = useMemo(
    () => ({ breaks, loading, error }),
    [breaks, loading, error]
  );

  return <BreaksContext.Provider value={value}>{children}</BreaksContext.Provider>;
}

export const useBreaksData = () => {
  const context = useContext(BreaksContext);
  if (!context) {
    throw new Error("useBreaksData must be used within BreaksProvider");
  }
  return context;
};

export const useBreakStatus = (): BreakStatus => {
  const { breaks, loading } = useBreaksData();
  const [status, setStatus] = useState<BreakStatus>({
    activeBreak: null,
    timeRemaining: 0,
    isBreakActive: false,
    loading: true,
  });

  useEffect(() => {
    if (loading) {
      setStatus((prev) => ({ ...prev, loading: true }));
      return;
    }

    const checkBreaks = () => {
      const currentTime = Date.now();
      const orderedBreaks = [...breaks].sort((a, b) => a.startTime - b.startTime);
      const currentBreak =
        orderedBreaks.find(
          (b) => currentTime >= b.startTime && currentTime < b.endTime
        ) || null;

      if (currentBreak) {
        setStatus({
          activeBreak: currentBreak,
          timeRemaining: currentBreak.endTime - currentTime,
          isBreakActive: true,
          loading: false,
        });
      } else {
        setStatus({
          activeBreak: null,
          timeRemaining: 0,
          isBreakActive: false,
          loading: false,
        });
      }
    };

    checkBreaks();
    const interval = setInterval(checkBreaks, 1000);

    return () => clearInterval(interval);
  }, [breaks, loading]);

  return status;
};
