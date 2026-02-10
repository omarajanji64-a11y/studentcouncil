"use client";

import { PageHeader } from "@/components/shared/page-header";
import { DutyScheduleEditor } from "@/components/schedule/duty-schedule";
import { useRequireAuth } from "@/hooks/use-auth";

export default function SchedulePage() {
  useRequireAuth();

  return (
    <div>
      <PageHeader
        title="Schedule"
        description="Manage duty shifts with editable times."
      />
      <div className="mb-6">
        <DutyScheduleEditor />
      </div>
    </div>
  );
}
