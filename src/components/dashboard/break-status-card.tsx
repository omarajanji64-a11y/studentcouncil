"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBreakStatus } from "@/hooks/use-break-status";
import { Clock, Coffee, Loader2 } from "lucide-react";

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
      <Card className="flex flex-col items-center justify-center p-6 bg-secondary">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  return (
    <Card className={`flex flex-col items-center justify-center p-6 ${isBreakActive ? "bg-green-100 dark:bg-green-900/20" : "bg-amber-50 dark:bg-amber-900/20"}`}>
        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${isBreakActive ? "bg-green-500/20 text-green-600 dark:text-green-400" : "bg-amber-500/20 text-amber-600 dark:text-amber-400"}`}>
            {isBreakActive ? <Coffee className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
        </div>
        <div className="mt-4 text-center">
        <p className="text-lg font-semibold">
          {isBreakActive ? activeBreak?.name : "No Active Break"}
        </p>
        <p className={`text-sm ${isBreakActive ? "text-green-700 dark:text-green-300" : "text-amber-700 dark:text-amber-300"}`}>
          {isBreakActive ? `${formatTime(timeRemaining)} remaining` : "Pass issuing is disabled"}
        </p>
        </div>
    </Card>
  );
}
