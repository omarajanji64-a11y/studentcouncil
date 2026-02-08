"use client";

import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { LogsTable } from "@/components/logs/logs-table";
import { useLogs } from "@/hooks/use-firestore";
import { useAuth } from "@/hooks/use-auth";
import { isStaff } from "@/lib/permissions";

export default function LogsPage() {
  const { data: logs, loading } = useLogs();
  const { user } = useAuth();
  const visibleLogs = isStaff(user)
    ? logs
    : logs.filter((log) => log.userId === user?.uid);

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
