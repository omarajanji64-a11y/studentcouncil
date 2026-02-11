"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MotionModal } from "@/components/motion/motion-modal";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, File } from "lucide-react";
import type { Complaint, Duty } from "@/lib/types";
import { updateComplaint } from "@/hooks/use-firestore";
import { useAuth } from "@/hooks/use-auth";
import { isSupervisor } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const statusOptions: Complaint["status"][] = ["Open", "In Progress", "Resolved"];

export function ComplaintsTable({
  data,
  duties,
  loading,
  staffView,
  onRefresh,
  searchValue,
  onSearchChange,
  serverSide = false,
}: {
  data: Complaint[];
  duties: Duty[];
  loading?: boolean;
  staffView?: boolean;
  onRefresh?: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  serverSide?: boolean;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<Complaint["status"][]>([]);
  const [dutyFilter, setDutyFilter] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeComplaint, setActiveComplaint] = useState<Complaint | null>(null);
  const [status, setStatus] = useState<Complaint["status"]>("Open");
  const [gallery, setGallery] = useState<Complaint | null>(null);

  const dutyLabel = useMemo(() => {
    const map = new Map<string, string>();
    duties.forEach((duty) => map.set(duty.id, duty.title));
    return map;
  }, [duties]);

  const effectiveFilter = searchValue ?? filter;
  const showAdvancedFilters = !serverSide;

  const filtered = useMemo(() => {
    let filteredData = serverSide
      ? [...data]
      : [...data].sort((a, b) => b.timestamp - a.timestamp);
    if (!serverSide && effectiveFilter) {
      const includesStudentInfo = isSupervisor(user);
      filteredData = filteredData.filter((complaint) =>
        [
          includesStudentInfo ? complaint.studentId : "",
          includesStudentInfo ? complaint.studentName ?? "" : "",
          complaint.groupName ?? "",
          complaint.targetName ?? complaint.title,
          complaint.description,
        ]
          .join(" ")
          .toLowerCase()
          .includes(effectiveFilter.toLowerCase())
      );
    }
    if (!serverSide && statusFilter.length) {
      filteredData = filteredData.filter((complaint) =>
        statusFilter.includes(complaint.status)
      );
    }
    if (!serverSide && dutyFilter.length) {
      filteredData = filteredData.filter((complaint) =>
        complaint.dutyId ? dutyFilter.includes(complaint.dutyId) : false
      );
    }
    if (!serverSide && startDate) {
      const start = new Date(startDate).getTime();
      filteredData = filteredData.filter((complaint) => complaint.timestamp >= start);
    }
    if (!serverSide && endDate) {
      const end = new Date(endDate).getTime();
      filteredData = filteredData.filter((complaint) => complaint.timestamp <= end);
    }
    return filteredData;
  }, [
    data,
    effectiveFilter,
    statusFilter,
    dutyFilter,
    startDate,
    endDate,
    serverSide,
    user,
  ]);

  const openEditor = (complaint: Complaint) => {
    setActiveComplaint(complaint);
    setStatus(complaint.status);
  };

  const handleUpdate = async () => {
    if (!activeComplaint || !user) return;
    try {
      await updateComplaint(
        activeComplaint.id,
        {
          status,
          handledBy: user.name,
          handledById: user.uid,
          studentId: activeComplaint.studentId,
        },
        user.uid
      );
      onRefresh?.();
      setActiveComplaint(null);
      toast({
        title: "Complaint updated",
        description: "Status has been saved.",
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Unable to update the complaint.";
      toast({
        variant: "destructive",
        title: "Update failed",
        description: message,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Search student name..."
          value={effectiveFilter}
          onChange={(event) => (onSearchChange ?? setFilter)(event.target.value)}
          className="w-full sm:max-w-sm"
        />
        {showAdvancedFilters ? (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">From</Label>
              <Input
                type="date"
                className="h-9"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">To</Label>
              <Input
                type="date"
                className="h-9"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Status <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {statusOptions.map((status) => (
                  <DropdownMenuCheckboxItem
                    key={status}
                    checked={statusFilter.includes(status)}
                    onCheckedChange={(checked) => {
                      setStatusFilter((current) =>
                        checked ? [...current, status] : current.filter((s) => s !== status)
                      );
                    }}
                  >
                    {status}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Duty <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {duties.map((duty) => (
                  <DropdownMenuCheckboxItem
                    key={duty.id}
                    checked={dutyFilter.includes(duty.id)}
                    onCheckedChange={(checked) => {
                      setDutyFilter((current) =>
                        checked ? [...current, duty.id] : current.filter((d) => d !== duty.id)
                      );
                    }}
                  >
                    {duty.title}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" variant="outline" className="h-9 gap-1">
              <File className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Export
              </span>
            </Button>
          </div>
        ) : null}
      </div>
      <div className="grid gap-3 md:hidden">
        {loading ? (
          <Card>
            <CardContent className="pt-6 text-center text-sm text-muted-foreground">
              Loading complaints...
            </CardContent>
          </Card>
        ) : filtered.length ? (
          filtered.map((complaint) => {
            const nameLabel =
              complaint.targetType === "group" && complaint.groupName
                ? complaint.groupName
                : isSupervisor(user)
                ? complaint.studentName ?? complaint.studentId
                : "Hidden";
            const targetLabel = complaint.targetName ?? complaint.title;
            return (
              <Card key={complaint.id}>
                <CardContent className="pt-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold">{targetLabel}</div>
                      <div className="text-sm text-muted-foreground">{nameLabel}</div>
                    </div>
                    <Badge variant="secondary">{complaint.status}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {complaint.description}
                  </div>
                  <div className="grid gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Duty</span>
                      <span>
                        {complaint.dutyId ? dutyLabel.get(complaint.dutyId) ?? "Unknown" : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Location</span>
                      <span>{complaint.dutyLocation ?? "N/A"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Submitted</span>
                      <span>{format(new Date(complaint.timestamp), "PPp")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {complaint.attachments?.length ? (
                      <Button size="sm" variant="outline" onClick={() => setGallery(complaint)}>
                        View ({complaint.attachments.length})
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">No attachments</span>
                    )}
                    {staffView ? (
                      <Button size="sm" variant="outline" onClick={() => openEditor(complaint)}>
                        Update
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="pt-6 text-center text-sm text-muted-foreground">
              No complaints found.
            </CardContent>
          </Card>
        )}
      </div>

      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reported By</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead>Duty</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Attachments</TableHead>
              {staffView ? <TableHead>Handled By</TableHead> : null}
              {staffView ? <TableHead>Actions</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={staffView ? 9 : 7} className="h-24 text-center">
                  Loading complaints...
                </TableCell>
              </TableRow>
            ) : filtered.length ? (
              filtered.map((complaint) => (
                <TableRow key={complaint.id}>
                  <TableCell className="font-medium">
                    {complaint.targetType === "group" && complaint.groupName
                      ? complaint.groupName
                      : isSupervisor(user)
                      ? complaint.studentName ?? complaint.studentId
                      : "Hidden"}
                  </TableCell>
                  <TableCell>{complaint.targetName ?? complaint.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {complaint.dutyId ? dutyLabel.get(complaint.dutyId) ?? "Unknown" : "N/A"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {complaint.dutyLocation ?? "N/A"}
                  </TableCell>
                  <TableCell>{complaint.status}</TableCell>
                  <TableCell>{format(new Date(complaint.timestamp), "PPp")}</TableCell>
                  <TableCell>
                    {complaint.attachments?.length ? (
                      <Button size="sm" variant="outline" onClick={() => setGallery(complaint)}>
                        View ({complaint.attachments.length})
                      </Button>
                    ) : (
                      "None"
                    )}
                  </TableCell>
                  {staffView ? <TableCell>{complaint.handledBy ?? "N/A"}</TableCell> : null}
                  {staffView ? (
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => openEditor(complaint)}>
                        Update
                      </Button>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={staffView ? 9 : 7} className="h-24 text-center">
                  No complaints found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <MotionModal
        open={!!activeComplaint}
        onOpenChange={(open) => !open && setActiveComplaint(null)}
        title="Update Complaint"
        description="Update status and add handling notes."
        contentClassName="sm:max-w-[480px]"
        footer={<Button onClick={handleUpdate}>Save Update</Button>}
      >
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Status</Label>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((option) => (
                  <Button
                    key={option}
                    type="button"
                    variant={status === option ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatus(option)}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          </div>
      </MotionModal>

      <MotionModal
        open={!!gallery}
        onOpenChange={(open) => !open && setGallery(null)}
        title="Complaint Photos"
        description="Attached images from the complaint."
        contentClassName="sm:max-w-[720px]"
        footer={<Button onClick={() => setGallery(null)}>Close</Button>}
      >
        <div className="grid gap-3 py-2 sm:grid-cols-2">
          {gallery?.attachments?.length ? (
            gallery.attachments.map((attachment) => (
              <div key={attachment.url} className="rounded-md border bg-muted/20 p-2">
                <img
                  src={attachment.url}
                  alt="Complaint attachment"
                  className="h-48 w-full rounded-md object-cover"
                />
                <div className="mt-2 text-xs text-muted-foreground">
                  {attachment.contentType ?? "image"}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No attachments.</div>
          )}
        </div>
      </MotionModal>
    </div>
  );
}
