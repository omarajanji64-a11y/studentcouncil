"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MotionModal } from "@/components/motion/motion-modal";
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

const statusOptions: Complaint["status"][] = ["Open", "In Progress", "Resolved"];

export function ComplaintsTable({
  data,
  duties,
  loading,
  staffView,
}: {
  data: Complaint[];
  duties: Duty[];
  loading?: boolean;
  staffView?: boolean;
}) {
  const { user } = useAuth();
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<Complaint["status"][]>([]);
  const [dutyFilter, setDutyFilter] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeComplaint, setActiveComplaint] = useState<Complaint | null>(null);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<Complaint["status"]>("Open");

  const dutyLabel = useMemo(() => {
    const map = new Map<string, string>();
    duties.forEach((duty) => map.set(duty.id, duty.title));
    return map;
  }, [duties]);

  const filtered = useMemo(() => {
    let filteredData = data;
    if (filter) {
      filteredData = filteredData.filter((complaint) =>
        [
          complaint.studentId,
          complaint.studentName ?? "",
          complaint.title,
          complaint.description,
        ]
          .join(" ")
          .toLowerCase()
          .includes(filter.toLowerCase())
      );
    }
    if (statusFilter.length) {
      filteredData = filteredData.filter((complaint) =>
        statusFilter.includes(complaint.status)
      );
    }
    if (dutyFilter.length) {
      filteredData = filteredData.filter((complaint) =>
        complaint.dutyId ? dutyFilter.includes(complaint.dutyId) : false
      );
    }
    if (startDate) {
      const start = new Date(startDate).getTime();
      filteredData = filteredData.filter((complaint) => complaint.timestamp >= start);
    }
    if (endDate) {
      const end = new Date(endDate).getTime();
      filteredData = filteredData.filter((complaint) => complaint.timestamp <= end);
    }
    return filteredData;
  }, [data, filter, statusFilter, dutyFilter, startDate, endDate]);

  const openEditor = (complaint: Complaint) => {
    setActiveComplaint(complaint);
    setNotes(complaint.notes ?? "");
    setStatus(complaint.status);
  };

  const handleUpdate = async () => {
    if (!activeComplaint || !user) return;
    await updateComplaint(
      activeComplaint.id,
      {
        status,
        notes,
        handledBy: user.name,
        handledById: user.uid,
      },
      user.uid
    );
    setActiveComplaint(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          placeholder="Search by student or title..."
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="max-w-sm"
        />
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
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Duty</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              {staffView ? <TableHead>Handled By</TableHead> : null}
              {staffView ? <TableHead>Actions</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={staffView ? 7 : 5} className="h-24 text-center">
                  Loading complaints...
                </TableCell>
              </TableRow>
            ) : filtered.length ? (
              filtered.map((complaint) => (
                <TableRow key={complaint.id}>
                  <TableCell className="font-medium">
                    {complaint.studentName ?? complaint.studentId}
                  </TableCell>
                  <TableCell>{complaint.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {complaint.dutyId ? dutyLabel.get(complaint.dutyId) ?? "Unknown" : "N/A"}
                  </TableCell>
                  <TableCell>{complaint.status}</TableCell>
                  <TableCell>{format(new Date(complaint.timestamp), "PPp")}</TableCell>
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
                <TableCell colSpan={staffView ? 7 : 5} className="h-24 text-center">
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
          <div className="grid gap-2">
            <Label htmlFor="complaint-notes">Notes</Label>
            <Input
              id="complaint-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add notes for resolution..."
            />
          </div>
        </div>
      </MotionModal>
    </div>
  );
}
