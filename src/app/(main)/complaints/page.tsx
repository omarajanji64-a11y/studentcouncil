"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ComplaintForm } from "@/components/complaints/complaint-form";
import { ComplaintsTable } from "@/components/complaints/complaints-table";
import { useAuth } from "@/hooks/use-auth";
import { useComplaints, useDuties, useLogs } from "@/hooks/use-firestore";
import { isStaff } from "@/lib/permissions";
import { LogsTable } from "@/components/logs/logs-table";

export default function ComplaintsPage() {
  const { user } = useAuth();
  const { data: complaints, loading } = useComplaints();
  const { data: duties } = useDuties();
  const { data: logs, loading: logsLoading } = useLogs();
  const staffView = isStaff(user);
  if (!user) return null;
  const visibleComplaints = staffView
    ? complaints
    : complaints.filter((complaint) => complaint.studentId === user?.uid);
  const visibleComplaintIds = new Set(visibleComplaints.map((complaint) => complaint.id));
  const complaintLogs = staffView
    ? logs.filter((log) => log.entityType === "complaint")
    : logs.filter(
        (log) => log.entityType === "complaint" && visibleComplaintIds.has(log.entityId)
      );

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
          />
        </CardContent>
      </Card>
      {staffView ? (
        <Card>
          <CardContent className="pt-6">
            <LogsTable data={complaintLogs} loading={logsLoading} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
