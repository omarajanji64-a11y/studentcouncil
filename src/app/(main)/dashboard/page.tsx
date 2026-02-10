"use client";

import { PageHeader } from "@/components/shared/page-header";
import { BreakStatusCard } from "@/components/dashboard/break-status-card";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { AnimatedCard } from "@/components/motion/animated-card";
import { AnimatedList } from "@/components/motion/animated-list";
import { useAuth } from "@/hooks/use-auth";
import { isStaff } from "@/lib/permissions";
import { useActivePasses, useComplaints, useDuties } from "@/hooks/use-firestore";
import { format } from "date-fns";
import { useMemo } from "react";

export default function DashboardPage() {
  const { user } = useAuth();
  const staffView = isStaff(user);
  const sinceMs = useMemo(() => Date.now() - 24 * 60 * 60 * 1000, []);
  const { data: passes } = useActivePasses();
  const { data: complaints } = useComplaints({
    studentId: staffView ? undefined : user?.uid,
    enabled: !!user,
    realtime: staffView,
    sinceMs,
  });
  const { data: duties } = useDuties({ enabled: !!user, realtime: false });

  const activePassPreview = passes
    .filter((pass) => pass.status === "active")
    .sort((a, b) => b.issuedAt - a.issuedAt)
    .slice(0, 3);

  const visibleComplaints = staffView
    ? complaints
    : complaints.filter((complaint) => complaint.studentId === user?.uid);

  const complaintPreview = visibleComplaints
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 3);

  const now = Date.now();
  const memberDuties = duties
    .filter((duty) => duty.memberIds.includes(user?.uid ?? ""))
    .sort((a, b) => a.startTime - b.startTime)
    .filter((duty) => duty.endTime >= now)
    .slice(0, 3);

  const staffDuties = duties
    .filter((duty) => duty.endTime >= now)
    .sort((a, b) => a.startTime - b.startTime)
    .slice(0, 3);

  const dutyPreview = staffView ? staffDuties : memberDuties;

  return (
    <div className="container mx-auto px-0">
      <PageHeader
        title="Dashboard"
        description="Overview of student council activity."
      />
      <div className="grid gap-6">
        <AnimatedList className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatedCard>
            <BreakStatusCard />
          </AnimatedCard>
        </AnimatedList>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">
            Quick Preview
          </h2>
          <AnimatedList className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <AnimatedCard>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Active Passes</CardTitle>
                  <CardDescription>Latest active passes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {activePassPreview.length ? (
                    activePassPreview.map((pass) => (
                      <div key={pass.id} className="flex items-center justify-between gap-3">
                        <div className="truncate font-medium">{pass.studentName}</div>
                        <div className="text-muted-foreground">
                          {format(new Date(pass.issuedAt), "p")}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-muted-foreground">No active passes.</div>
                  )}
                </CardContent>
              </Card>
            </AnimatedCard>

            <AnimatedCard>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Complaints</CardTitle>
                  <CardDescription>Recent submissions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {complaintPreview.length ? (
                    complaintPreview.map((complaint) => (
                      <div key={complaint.id} className="flex items-center justify-between gap-3">
                        <div className="truncate font-medium">{complaint.title}</div>
                        <div className="text-muted-foreground">{complaint.status}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-muted-foreground">No complaints yet.</div>
                  )}
                </CardContent>
              </Card>
            </AnimatedCard>

            <AnimatedCard>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>
                    {staffView ? "Upcoming Duties" : "Duty Schedule"}
                  </CardTitle>
                  <CardDescription>
                    {staffView ? "Next scheduled shifts" : "Your upcoming duties"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {dutyPreview.length ? (
                    dutyPreview.map((duty) => (
                      <div key={duty.id} className="space-y-1">
                        <div className="truncate font-medium">
                          {duty.location ?? duty.title}
                        </div>
                        <div className="text-muted-foreground">
                          {format(new Date(duty.startTime), "p")} -{" "}
                          {format(new Date(duty.endTime), "p")}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-muted-foreground">
                      No upcoming duties scheduled.
                    </div>
                  )}
                </CardContent>
              </Card>
            </AnimatedCard>
          </AnimatedList>
        </div>
      </div>
    </div>
  );
}
