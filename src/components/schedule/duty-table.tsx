"use client";

import { DutyScheduleEditor } from "@/components/schedule/duty-schedule";
import type { Duty } from "@/lib/types";

type DutyTableProps = {
  duties?: Duty[];
  realtime?: boolean;
};

// Legacy wrapper: always render the revised schedule editor.
export function DutyTable(_props: DutyTableProps) {
  return <DutyScheduleEditor />;
}
