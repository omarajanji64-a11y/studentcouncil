"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ComplaintForm } from "@/components/complaints/complaint-form";
import { ComplaintsTable } from "@/components/complaints/complaints-table";
import { useAuth } from "@/hooks/use-auth";
import { useComplaints, useDuties } from "@/hooks/use-firestore";
import { isStaff } from "@/lib/permissions";
import { useMemo } from "react";

export default function ComplaintsPage() {
  const { user } = useAuth();
  const staffView = isStaff(user);
  const sinceMs = useMemo(() => Date.now() - 24 * 60 * 60 * 1000, []);
  const { data: complaints, loading, refresh } = useComplaints({
    studentId: staffView ? undefined : user?.uid,
    enabled: !!user,
    realtime: staffView,
    sinceMs,
  });
  const { data: duties } = useDuties({ enabled: !!user, realtime: false });
  if (!user) return null;
  const visibleComplaints = staffView
    ? complaints
    : complaints.filter((complaint) => complaint.studentId === user?.uid);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Complaints"
        description="Submit complaints and manage resolution status."
      />
      <ComplaintForm />
      <Card>
        <CardContent className="pt-6">
          <ComplaintsTable
            data={visibleComplaints}
            duties={duties}
            loading={loading}
            staffView={staffView}
            onRefresh={refresh}
          />
        </CardContent>
      </Card>
    </div>
  );
}
