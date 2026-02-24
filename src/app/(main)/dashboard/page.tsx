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
import { useBreaksData } from "@/hooks/use-break-status";
import { isStaff } from "@/lib/permissions";
import { resolveMostRecentBreakWindow } from "@/lib/break-schedule";
import { useActivePasses, useComplaints, useDuties } from "@/hooks/use-firestore";
import { format, formatDistanceToNowStrict } from "date-fns";
import { useMemo } from "react";

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

export default function DashboardPage() {
  const { user } = useAuth();
  const { breaks } = useBreaksData();
  const staffView = isStaff(user);
  const sinceMs = useMemo(() => Date.now() - TWO_DAYS_MS, []);
  const { data: passes } = useActivePasses({ limit: 0 });
  const { data: complaints } = useComplaints({
    studentId: staffView ? undefined : user?.uid,
    enabled: !!user,
    realtime: staffView,
    sinceMs,
  });
  const { data: duties } = useDuties({ enabled: !!user, realtime: false });

  const sortedActivePasses = passes
    .filter((pass) => pass.status === "active")
    .sort((a, b) => b.issuedAt - a.issuedAt);
  const now = Date.now();
  const lastTwoBreakWindows = breaks
    .map((breakItem) => resolveMostRecentBreakWindow(breakItem, now))
    .sort((a, b) => b.startTime - a.startTime)
    .slice(0, 2);
  const permanentPasses = sortedActivePasses.filter(
    (pass) => pass.passType === "permanent"
  );
  const activePasses = sortedActivePasses.filter(
    (pass) =>
      pass.passType !== "permanent" &&
      lastTwoBreakWindows.some(
        (window) =>
          pass.issuedAt >= window.startTime && pass.issuedAt <= window.endTime
      )
  );

  const visibleComplaints = staffView
    ? complaints
    : complaints.filter((complaint) => complaint.studentId === user?.uid);

  const complaintPreview = visibleComplaints
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 3);

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
          <AnimatedList className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <AnimatedCard>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Dashboard Complaints</CardTitle>
                  <CardDescription>Recent submissions in the last 2 days</CardDescription>
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

          <AnimatedCard>
            <Card>
              <CardHeader>
                <CardTitle>Active Passes</CardTitle>
                <CardDescription>
                  Temporary active passes from the last 2 breaks.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {activePasses.length ? (
                  activePasses.map((pass) => (
                    <div key={pass.id} className="rounded-md border p-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{pass.studentName}</span>
                            <span className="text-xs text-muted-foreground">
                              Grade {pass.studentGrade ?? "N/A"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {pass.permissionLocation ?? "Canteen"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground break-words">
                            {pass.reason}
                          </p>
                        </div>
                        <div className="grid gap-1 text-xs text-muted-foreground sm:text-right">
                          <span>Issued: {format(new Date(pass.issuedAt), "PP p")}</span>
                          <span>Expires: {format(new Date(pass.expiresAt), "PP p")}</span>
                          <span>
                            Remaining:{" "}
                            {pass.expiresAt > now
                              ? `${formatDistanceToNowStrict(new Date(pass.expiresAt))} left`
                              : "expired"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">No active passes.</div>
                )}
              </CardContent>
            </Card>
          </AnimatedCard>

          <AnimatedCard>
            <Card>
              <CardHeader>
                <CardTitle>Permanent Passes</CardTitle>
                <CardDescription>
                  Permanent passes stay here until deleted.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {permanentPasses.length ? (
                  permanentPasses.map((pass) => (
                    <div key={pass.id} className="rounded-md border p-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{pass.studentName}</span>
                            <span className="text-xs text-muted-foreground">
                              Grade {pass.studentGrade ?? "N/A"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {pass.permissionLocation ?? "Canteen"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground break-words">
                            {pass.reason}
                          </p>
                        </div>
                        <div className="grid gap-1 text-xs text-muted-foreground sm:text-right">
                          <span>Issued: {format(new Date(pass.issuedAt), "PP p")}</span>
                          <span>Expires: No expiry</span>
                          <span>Status: Until deleted</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">No permanent passes.</div>
                )}
              </CardContent>
            </Card>
          </AnimatedCard>
        </div>
      </div>
    </div>
  );
}
