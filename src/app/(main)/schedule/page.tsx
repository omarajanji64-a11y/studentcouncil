"use client";

import { PageHeader } from "@/components/shared/page-header";
import { DutyTable } from "@/components/schedule/duty-table";
import { useRequireAuth } from "@/hooks/use-auth";
import { isStaff } from "@/lib/permissions";

export default function SchedulePage() {
  const { user } = useRequireAuth();
  const realtime = isStaff(user);

  return (
    <div>
      <PageHeader
        title="Schedule"
        description="Manage duty shifts and assignments."
      />
      <div className="mb-6">
        <DutyTable realtime={realtime} />
      </div>
    </div>
  );
}
