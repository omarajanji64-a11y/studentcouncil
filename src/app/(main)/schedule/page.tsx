"use client";

import { PageHeader } from "@/components/shared/page-header";
import { DutyTable } from "@/components/schedule/duty-table";
import { useRequireAuth } from "@/hooks/use-auth";

export default function SchedulePage() {
  useRequireAuth();

  return (
    <div>
      <PageHeader
        title="Schedule"
        description="Manage duty shifts and assignments."
      />
      <div className="mb-6">
        <DutyTable />
      </div>
    </div>
  );
}
