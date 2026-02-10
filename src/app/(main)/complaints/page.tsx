"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ComplaintForm } from "@/components/complaints/complaint-form";
import { ComplaintsTable } from "@/components/complaints/complaints-table";
import { useAuth } from "@/hooks/use-auth";
import { useComplaints, useDuties } from "@/hooks/use-firestore";
import { isStaff } from "@/lib/permissions";

export default function ComplaintsPage() {
  const { user } = useAuth();
  const staffView = isStaff(user);
  const { data: complaints, loading, refresh } = useComplaints({
    studentId: staffView ? undefined : user?.uid,
    enabled: !!user,
    realtime: staffView,
  });
  const { data: duties } = useDuties({ realtime: staffView });
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
