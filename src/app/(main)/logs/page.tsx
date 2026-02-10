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
import { useMemo } from "react";

export default function LogsPage() {
  const { user } = useAuth();
  const staffView = isStaff(user);
  const { data: staffLogs, loading: staffLoading } = useLogs({
    limit: 200,
    enabled: staffView,
    realtime: staffView,
  });
  const { data: userLogs, loading: userLoading } = useUserLogs(user?.uid, {
    enabled: !!user && !staffView,
    realtime: false,
  });
  const logs = staffView ? staffLogs : userLogs;
  const loading = staffView ? staffLoading : userLoading;
  const visibleLogs = useMemo(
    () => [...logs].sort((a, b) => b.timestamp - a.timestamp),
    [logs]
  );

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
      <Card>
        <CardContent className="pt-6">
            <LogsTable data={visibleLogs} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}
