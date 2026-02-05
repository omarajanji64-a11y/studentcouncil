"use client";

import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { LogsTable } from "@/components/logs/logs-table";
import { useLogs } from "@/hooks/use-firestore";

export default function LogsPage() {
  const { data: logs, loading } = useLogs();

  return (
    <div>
      <PageHeader
        title="Pass Logs"
        description="A permanent and immutable record of all passes issued."
      />
      <Card>
        <CardContent className="pt-6">
            <LogsTable data={logs} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}
