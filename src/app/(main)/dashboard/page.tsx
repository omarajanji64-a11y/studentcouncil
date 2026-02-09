"use client";

import Link from "next/link";
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
import {
  Ticket,
  ScrollText,
  CalendarClock,
  MessageSquare,
  BarChart3,
} from "lucide-react";
import { isAdmin, isStaff } from "@/lib/permissions";
import { useBreaks, useComplaints, useDuties, useLogs, usePasses } from "@/hooks/use-firestore";
import { format } from "date-fns";
import { DutyTable } from "@/components/schedule/duty-table";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: passes } = usePasses();
  const { data: complaints } = useComplaints();
  const { data: logs } = useLogs();
  const { data: duties } = useDuties();
  const { data: breaks } = useBreaks();

  const shortcuts = [
    {
      href: "/logs",
      icon: ScrollText,
      title: "Activity Logs",
      description: "Review activity history and audit trails.",
    },
    {
      href: "/schedule",
      icon: CalendarClock,
      title: "Duty Schedule",
      description: "Manage duty shifts and break schedules.",
    },
    {
      href: "/analytics",
      icon: BarChart3,
      title: "Analytics",
      description: "Operational overview and trends.",
      role: "admin",
    },
  ];

  const activePassPreview = passes
    .filter((pass) => pass.status === "active")
    .sort((a, b) => b.issuedAt - a.issuedAt)
    .slice(0, 3);

  const visibleComplaints = isStaff(user)
    ? complaints
    : complaints.filter((complaint) => complaint.studentId === user?.uid);

  const complaintPreview = visibleComplaints
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 3);

  const visibleLogs = isStaff(user)
    ? logs
    : logs.filter((log) => log.userId === user?.uid);

  const logPreview = visibleLogs
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 3);

  const now = Date.now();
  const memberDuties = duties
    .filter((duty) => duty.memberIds.includes(user?.uid ?? ""))
    .sort((a, b) => a.startTime - b.startTime)
    .filter((duty) => duty.endTime >= now)
    .slice(0, 3);

  return (
    <div className="container mx-auto px-0">
      <PageHeader
        title="Dashboard"
        description="Overview of canteen pass activity."
      />
      <div className="grid gap-6">
        <AnimatedList className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatedCard>
            <BreakStatusCard />
          </AnimatedCard>
        </AnimatedList>

        <div className="space-y-4 pt-6">
          <h2 className="text-xl font-semibold tracking-tight">
            Quick Shortcuts
          </h2>
          <AnimatedList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {shortcuts.map(
              (shortcut) =>
                (!shortcut.role ||
                  (shortcut.role === "staff" && isStaff(user)) ||
                  (shortcut.role === "admin" && isAdmin(user))) && (
                  <Link
                    href={shortcut.href}
                    key={shortcut.href}
                    className="block hover:no-underline"
                  >
                    <AnimatedCard>
                      <Card className="h-full transition-colors hover:border-primary/50 hover:bg-muted/50">
                        <CardHeader>
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <shortcut.icon className="h-6 w-6" />
                            </div>
                            <CardTitle className="text-lg">
                              {shortcut.title}
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <CardDescription>
                            {shortcut.description}
                          </CardDescription>
                        </CardContent>
                      </Card>
                    </AnimatedCard>
                  </Link>
                )
            )}
          </AnimatedList>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">
            Quick Preview
          </h2>
          <AnimatedList className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Link href="/passes" className="block hover:no-underline">
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
            </Link>

            <Link href="/complaints" className="block hover:no-underline">
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
            </Link>

            <Link href="/logs" className="block hover:no-underline">
              <AnimatedCard>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Activity Logs</CardTitle>
                    <CardDescription>Latest actions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {logPreview.length ? (
                      logPreview.map((log) => (
                        <div key={log.id} className="flex items-center justify-between gap-3">
                          <div className="truncate font-medium">{log.action}</div>
                          <div className="text-muted-foreground">{log.entityType}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-muted-foreground">No recent activity.</div>
                    )}
                  </CardContent>
                </Card>
              </AnimatedCard>
            </Link>

            {!isStaff(user) ? (
              <Link href="/schedule" className="block hover:no-underline">
                <AnimatedCard>
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle>Duty Schedule</CardTitle>
                      <CardDescription>Your upcoming duties</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {memberDuties.length ? (
                        memberDuties.map((duty) => (
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
                          No upcoming duties assigned.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </AnimatedCard>
              </Link>
            ) : null}
          </AnimatedList>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">
            Duty Schedule
          </h2>
          <DutyTable />
        </div>
      </div>
    </div>
  );
}
