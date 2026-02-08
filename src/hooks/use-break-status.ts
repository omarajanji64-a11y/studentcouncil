"use client";

import { useState, useEffect, useRef } from "react";
import type { Break } from "@/lib/types";
import { useBreaks } from "@/hooks/use-firestore";
import { logAction } from "@/lib/logging";

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
  const lastBreakId = useRef<string | null>(null);
  const lastActive = useRef<boolean>(false);

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

      if (currentBreak && (!lastActive.current || lastBreakId.current !== currentBreak.id)) {
        logAction({
          userId: "system",
          action: "break_started",
          entityType: "break",
          entityId: currentBreak.id,
          details: { name: currentBreak.name },
        });
        lastActive.current = true;
        lastBreakId.current = currentBreak.id;
      }

      if (!currentBreak && lastActive.current) {
        logAction({
          userId: "system",
          action: "break_ended",
          entityType: "break",
          entityId: lastBreakId.current ?? "",
        });
        lastActive.current = false;
        lastBreakId.current = null;
      }
    };

    checkBreaks();
    const interval = setInterval(checkBreaks, 1000);

    return () => clearInterval(interval);
  }, [breaks, loading]);

  return status;
};
