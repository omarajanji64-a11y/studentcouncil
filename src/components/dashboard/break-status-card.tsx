"use client";

import { Card } from "@/components/ui/card";
import { useBreakStatus } from "@/hooks/use-break-status";
import { Clock, Coffee } from "lucide-react";
import { motion } from "framer-motion";
import { easing, durations } from "@/lib/animations";
import { Skeleton } from "@/components/ui/skeleton";

export function BreakStatusCard() {
  const { isBreakActive, timeRemaining, activeBreak, loading } = useBreakStatus();

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Card className="flex flex-col items-center justify-center p-6 bg-secondary/40">
        <div className="flex w-full flex-col items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="w-full space-y-2">
            <Skeleton className="h-4 w-2/3 mx-auto" />
            <Skeleton className="h-3 w-1/2 mx-auto" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={`flex flex-col items-center justify-center p-6 ${
        isBreakActive
          ? "bg-green-100/60 dark:bg-green-900/20"
          : "bg-amber-50/60 dark:bg-amber-900/20"
      }`}
    >
      <motion.div
        className={`flex h-12 w-12 items-center justify-center rounded-full ${
          isBreakActive
            ? "bg-green-500/20 text-green-600 dark:text-green-400"
            : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
        }`}
        animate={{ scale: isBreakActive ? 1 : 0.98 }}
        transition={{ duration: durations.base, ease: easing }}
      >
        {isBreakActive ? (
          <Coffee className="h-6 w-6" />
        ) : (
          <Clock className="h-6 w-6" />
        )}
      </motion.div>
      <div className="mt-4 text-center">
        <p className="text-lg font-semibold">
          {isBreakActive ? activeBreak?.name : "No Active Break"}
        </p>
        <p
          className={`text-sm ${
            isBreakActive
              ? "text-green-700 dark:text-green-300"
              : "text-amber-700 dark:text-amber-300"
          }`}
        >
          {isBreakActive
            ? `${formatTime(timeRemaining)} remaining`
            : "Pass issuing is disabled"}
        </p>
      </div>
    </Card>
  );
}
