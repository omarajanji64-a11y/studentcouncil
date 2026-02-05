"use client";

import { useState, useEffect } from "react";
import type { Break } from "@/lib/types";
import { useBreaks } from "@/hooks/use-firestore";

interface BreakStatus {
  activeBreak: Break | null;
  timeRemaining: number;
  isBreakActive: boolean;
  loading: boolean;
}

export const useBreakStatus = (): BreakStatus => {
  const { data: breaks, loading } = useBreaks();
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
      const currentBreak =
        breaks.find(
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
