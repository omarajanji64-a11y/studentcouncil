"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useUsers } from "@/hooks/use-firestore";
import type { Log } from "@/lib/types";

type NameLookup = Map<string, string>;

const formatUserName = (id: string | undefined, lookup: NameLookup): string => {
  if (!id) return "Unknown user";
  return lookup.get(id) ?? id;
};

const toEndOfDay = (value: string) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
};

const toStartOfDay = (value: string) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

type DescribedLog = {
  log: Log;
  actorName: string;
  summary: string;
  displayType: "pass" | "complaint" | "other";
  searchText: string;
};

const describeLog = (log: Log, lookup: NameLookup): DescribedLog => {
  const details = (log.details ?? {}) as Record<string, any>;
  const actorName = formatUserName(log.userId, lookup);
  const names = new Set<string>();
  names.add(actorName);

  const reporterName =
    details.studentName ?? formatUserName(details.studentId, lookup);
  const targetName = details.title ?? details.targetName ?? "";
  if (reporterName) names.add(reporterName);
  if (targetName) names.add(targetName);
  if (details.issuedBy) names.add(details.issuedBy);
  if (details.studentName) names.add(details.studentName);

  let summary = `${actorName} performed ${log.action.replace(/_/g, " ")}.`;
  if (log.entityType === "complaint") {
    const location = details.dutyLocation ? ` at ${details.dutyLocation}` : "";
    if (log.action === "complaint_created") {
      summary = `${reporterName} filed a complaint about ${targetName || "a student"}${location}.`;
    } else if (log.action === "complaint_updated") {
      const status =
        typeof details.status === "string" ? details.status : "updated";
      summary = `${actorName} updated complaint ${log.entityId} to ${status}.`;
    }
  } else if (log.entityType === "pass") {
    const student = details.studentName || "a student";
    if (log.action === "pass_override_created") {
      summary = `${actorName} issued an override pass for ${student}.`;
    } else if (log.action === "pass_created") {
      summary = `${actorName} created a pass for ${student}.`;
    } else if (log.action === "pass_status_updated") {
      summary = `${actorName} updated pass ${log.entityId} to ${details.status ?? "updated"}.`;
    } else if (log.action === "pass_deleted") {
      summary = `${actorName} deleted permanent pass ${log.entityId}.`;
    }
  } else if (log.entityType === "auth") {
    if (log.action === "login") summary = `${actorName} signed in.`;
    if (log.action === "logout") summary = `${actorName} signed out.`;
  } else if (log.entityType === "user") {
    if (log.action === "user_created") {
      summary = `${actorName} created user ${details.name ?? log.entityId}.`;
    } else if (log.action === "user_deleted") {
      summary = `${actorName} removed user ${details.name ?? log.entityId}.`;
    } else if (log.action === "profile_updated") {
      summary = `${actorName} updated their profile.`;
    }
  }

  const displayType =
    log.entityType === "complaint"
      ? "complaint"
      : log.entityType === "pass"
      ? "pass"
      : "other";

  const searchText = Array.from(names)
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return { log, actorName, summary, displayType, searchText };
};

export function LogsTable({ data, loading }: { data: Log[]; loading?: boolean }) {
  const { data: users } = useUsers({ realtime: false });
  const lookup = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((user) => map.set(user.uid, user.name));
    return map;
  }, [users]);

  const [typeFilter, setTypeFilter] = useState<"all" | "pass" | "complaint" | "other">(
    "all"
  );
  const [nameFilter, setNameFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const describedLogs = useMemo(
    () => data.map((log) => describeLog(log, lookup)),
    [data, lookup]
  );

  const filteredLogs = useMemo(() => {
    const search = nameFilter.trim().toLowerCase();
    const start = startDate ? toStartOfDay(startDate) : null;
    const end = endDate ? toEndOfDay(endDate) : null;

    return describedLogs.filter((item) => {
      if (typeFilter !== "all" && item.displayType !== typeFilter) return false;
      if (start && item.log.timestamp < start) return false;
      if (end && item.log.timestamp > end) return false;
      if (search && !item.searchText.includes(search)) return false;
      return true;
    });
  }, [describedLogs, typeFilter, nameFilter, startDate, endDate]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">From</Label>
            <Input
              type="date"
              className="h-9 w-40"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">To</Label>
            <Input
              type="date"
              className="h-9 w-40"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Type</Label>
            <Select
              value={typeFilter}
              onValueChange={(value) =>
                setTypeFilter(value as "all" | "pass" | "complaint" | "other")
              }
            >
              <SelectTrigger className="h-9 w-40">
                <SelectValue placeholder="All activity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All activity</SelectItem>
                <SelectItem value="complaint">Complaints</SelectItem>
                <SelectItem value="pass">Passes</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Input
          placeholder="Filter by name (student or reporter)"
          className="h-9 w-full max-w-sm"
          value={nameFilter}
          onChange={(event) => setNameFilter(event.target.value)}
        />
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-40">When</TableHead>
              <TableHead className="w-48">User</TableHead>
              <TableHead className="w-32">Type</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell>
                    <Skeleton className="mb-1 h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                </TableRow>
              ))
            ) : filteredLogs.length ? (
              filteredLogs.map((item) => (
                <TableRow key={item.log.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(item.log.timestamp), "PPp")}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{item.actorName}</div>
                    <div className="text-xs text-muted-foreground">{item.log.userId}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.displayType === "other" ? "secondary" : "outline"}>
                      {item.displayType === "complaint"
                        ? "Complaint"
                        : item.displayType === "pass"
                        ? "Pass"
                        : "Other"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm leading-5">{item.summary}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-20 text-center text-sm text-muted-foreground">
                  No logs match the current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
