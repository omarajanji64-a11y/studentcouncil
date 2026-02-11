"use client";

import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { LogsTable } from "@/components/logs/logs-table";
import { useLogs, useUserLogs } from "@/hooks/use-firestore";
import { useAuth } from "@/hooks/use-auth";
import { isStaff } from "@/lib/permissions";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LogsPage() {
  const { user } = useAuth();
  const staffView = isStaff(user);
  const [selectedDate, setSelectedDate] = useState("");
  const dateRange = useMemo(() => {
    if (!selectedDate) return null;
    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(selectedDate);
    end.setHours(23, 59, 59, 999);
    return { sinceMs: start.getTime(), untilMs: end.getTime() };
  }, [selectedDate]);
  const { data: staffLogs, loading: staffLoading } = useLogs({
    limit: 200,
    enabled: staffView,
    realtime: false,
    sinceMs: dateRange?.sinceMs,
    untilMs: dateRange?.untilMs,
  });
  const { data: userLogs, loading: userLoading } = useUserLogs(user?.uid, {
    enabled: !!user && !staffView,
    realtime: false,
    limit: 200,
    sinceMs: dateRange?.sinceMs,
    untilMs: dateRange?.untilMs,
  });
  const logs = staffView ? staffLogs : userLogs;
  const loading = staffView ? staffLoading : userLoading;
  const visibleLogs = useMemo(() => {
    const sorted = [...logs].sort((a, b) => b.timestamp - a.timestamp);
    if (staffView) return sorted;
    return sorted.filter(
      (log) => log.entityType === "pass" || log.entityType === "complaint"
    );
  }, [logs, staffView]);

  return (
    <div>
      <PageHeader
        title="Activity Logs"
        description={
          isStaff(user)
            ? "A timeline of every action across the system."
            : "Your personal activity history."
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          type="date"
          className="h-9 w-44"
          value={selectedDate}
          onChange={(event) => setSelectedDate(event.target.value)}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => setSelectedDate("")}
          disabled={!selectedDate}
        >
          Clear
        </Button>
        <span className="text-xs text-muted-foreground">
          Showing {selectedDate ? "logs for the selected date" : "latest logs"}.
        </span>
      </div>
      <Card>
        <CardContent className="pt-6">
            <LogsTable data={visibleLogs} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}
