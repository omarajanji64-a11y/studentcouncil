"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRequireAuth } from "@/hooks/use-auth";
import { useActivePasses, useComplaints, useDuties, useLogs } from "@/hooks/use-firestore";
import { isAdmin } from "@/lib/permissions";
import { useMemo } from "react";

export default function AnalyticsPage() {
  const { user } = useRequireAuth("admin");
  const { data: complaints } = useComplaints({ realtime: true });
  const { data: passes } = useActivePasses();
  const { data: duties } = useDuties({ realtime: true });
  const sinceMs = useMemo(() => Date.now() - 24 * 60 * 60 * 1000, []);
  const { data: logs } = useLogs({ sinceMs, realtime: true });

  if (!isAdmin(user)) return null;

  const openComplaints = complaints.filter((c) => c.status !== "Resolved").length;
  const resolvedComplaints = complaints.filter((c) => c.status === "Resolved").length;
  const activePasses = passes.filter((p) => p.status === "active").length;
  const upcomingDuties = duties.filter((d) => d.startTime > Date.now()).length;
  const recentLogs = logs.filter((l) => l.timestamp > Date.now() - 24 * 60 * 60 * 1000).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Operational snapshot for administrators."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Active Passes</CardTitle>
            <CardDescription>Currently active student passes.</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{activePasses}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Open Complaints</CardTitle>
            <CardDescription>Complaints awaiting resolution.</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{openComplaints}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Resolved Complaints</CardTitle>
            <CardDescription>Total resolved cases.</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{resolvedComplaints}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Duties</CardTitle>
            <CardDescription>Shifts scheduled ahead.</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{upcomingDuties}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>24h Activity</CardTitle>
            <CardDescription>Logs captured in the last day.</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{recentLogs}</CardContent>
        </Card>
      </div>
    </div>
  );
}
