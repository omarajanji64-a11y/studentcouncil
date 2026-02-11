"use client";

import { useState } from "react";
import { format } from "date-fns";
import { MoreHorizontal, PlusCircle, X } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MotionModal } from "@/components/motion/motion-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { easing, durations } from "@/lib/animations";
import type { Break } from "@/lib/types";
import {
  createBreak,
  deleteBreak,
  updateBreak,
} from "@/hooks/use-firestore";
import { useBreaksData } from "@/hooks/use-break-status";
import { useAuth, useRequireAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { isStaff } from "@/lib/permissions";

export default function BreaksPage() {
  useRequireAuth();
  const { user } = useAuth();
  const { toast } = useToast();
  const { breaks, loading, error } = useBreaksData();
  const sortedBreaks = [...breaks].sort((a, b) => a.startTime - b.startTime);
  const [isOpen, setIsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [activeBreakId, setActiveBreakId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const canManageBreaks = isStaff(user);

  const isBreakActive = (b: Break) => {
    const now = Date.now();
    return now >= b.startTime && now < b.endTime;
  };

  const handleCreateBreak = async () => {
    if (!name || !startTime || !endTime) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please provide a name, start time, and end time.",
      });
      return;
    }

    const today = new Date();
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    const start = new Date(today);
    start.setHours(startHour, startMinute, 0, 0);
    const end = new Date(today);
    end.setHours(endHour, endMinute, 0, 0);

    try {
      await createBreak(
        {
          name,
          startTime: start.getTime(),
          endTime: end.getTime(),
        },
        user?.uid
      );

      setIsOpen(false);
      setName("");
      setStartTime("");
      setEndTime("");
      toast({
        title: "Break created",
        description: "The schedule has been updated in real time.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Break failed",
        description: "Unable to create the break. Check permissions and try again.",
      });
    }
  };

  const openEdit = (breakItem: Break) => {
    setActiveBreakId(breakItem.id);
    setName(breakItem.name);
    setStartTime(format(new Date(breakItem.startTime), "HH:mm"));
    setEndTime(format(new Date(breakItem.endTime), "HH:mm"));
    setEditOpen(true);
  };

  const handleUpdateBreak = async () => {
    if (!activeBreakId) return;
    const today = new Date();
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);
    const start = new Date(today);
    start.setHours(startHour, startMinute, 0, 0);
    const end = new Date(today);
    end.setHours(endHour, endMinute, 0, 0);
    await updateBreak(
      activeBreakId,
      { name, startTime: start.getTime(), endTime: end.getTime() },
      user?.uid
    );
    setEditOpen(false);
    setActiveBreakId(null);
    setName("");
    setStartTime("");
    setEndTime("");
    toast({
      title: "Break updated",
      description: "The break window has been updated.",
    });
  };

  const handleDeleteBreak = async (breakId: string) => {
    await deleteBreak(breakId, user?.uid);
    toast({
      title: "Break deleted",
      description: "The break has been removed.",
    });
  };

  const renderBreaksTable = (showActions: boolean) => {
    const colSpan = showActions ? 5 : 4;
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>End Time</TableHead>
            <TableHead>Status</TableHead>
            {showActions ? (
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={colSpan} className="h-24 text-center">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-2/3 mx-auto" />
                  <Skeleton className="h-4 w-1/2 mx-auto" />
                </div>
              </TableCell>
            </TableRow>
          ) : sortedBreaks.length ? (
            sortedBreaks.map((breakItem) => (
              <TableRow key={breakItem.id}>
                <TableCell className="font-medium">{breakItem.name}</TableCell>
                <TableCell>{format(new Date(breakItem.startTime), "p")}</TableCell>
                <TableCell>{format(new Date(breakItem.endTime), "p")}</TableCell>
                <TableCell>
                  <motion.div
                    animate={{
                      backgroundColor: isBreakActive(breakItem)
                        ? "rgba(34, 197, 94, 0.15)"
                        : "rgba(148, 163, 184, 0.18)",
                      color: isBreakActive(breakItem)
                        ? "rgb(21, 128, 61)"
                        : "rgb(100, 116, 139)",
                      scale: isBreakActive(breakItem) ? [1, 1.04, 1] : 1,
                    }}
                    transition={{ duration: durations.base, ease: easing }}
                    className="inline-flex rounded-full"
                  >
                    <Badge
                      variant="outline"
                      className="border-transparent bg-transparent px-2.5 py-0.5 text-xs font-semibold"
                    >
                      {isBreakActive(breakItem) ? "Active" : "Inactive"}
                    </Badge>
                  </motion.div>
                </TableCell>
                {showActions ? (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        aria-haspopup="true"
                        size="icon"
                        variant="ghost"
                        onClick={() => openEdit(breakItem)}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Edit break</span>
                      </Button>
                      <Button
                        aria-haspopup="true"
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleDeleteBreak(breakItem.id)}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Delete break</span>
                      </Button>
                    </div>
                  </TableCell>
                ) : null}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={colSpan} className="h-24 text-center">
                No breaks scheduled.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    );
  };

  return (
    <div>
      <PageHeader
        title="Scheduled Breaks"
        description="Manage break windows for issuing passes."
      >
        {canManageBreaks ? (
          <MotionModal
            open={isOpen}
            onOpenChange={(open) => {
              setIsOpen(open);
              if (open) {
                setName("");
                setStartTime("");
                setEndTime("");
              }
            }}
            trigger={
              <Button size="sm" className="gap-1">
                <PlusCircle className="h-4 w-4" />
                New Break
              </Button>
            }
            title="Schedule a Break"
            description="Breaks are synced to Firestore and update in real time."
            contentClassName="sm:max-w-[425px]"
            footer={<Button onClick={handleCreateBreak}>Save Break</Button>}
          >
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="break-name">Name</Label>
                <Input
                  id="break-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g., Lunch"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="break-start">Start Time</Label>
                <Input
                  id="break-start"
                  type="time"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="break-end">End Time</Label>
                <Input
                  id="break-end"
                  type="time"
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                />
              </div>
            </div>
          </MotionModal>
        ) : null}
      </PageHeader>
      {error ? (
        <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      {canManageBreaks ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Breaks</CardTitle>
              <CardDescription>
                Passes can only be issued during these scheduled times.
              </CardDescription>
            </CardHeader>
            <CardContent>{renderBreaksTable(true)}</CardContent>
          </Card>

          <MotionModal
            open={editOpen}
            onOpenChange={setEditOpen}
            title="Edit Break"
            description="Update the break name and time window."
            contentClassName="sm:max-w-[425px]"
            footer={<Button onClick={handleUpdateBreak}>Save Changes</Button>}
          >
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="break-name-edit">Name</Label>
                <Input
                  id="break-name-edit"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g., Lunch"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="break-start-edit">Start Time</Label>
                <Input
                  id="break-start-edit"
                  type="time"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="break-end-edit">End Time</Label>
                <Input
                  id="break-end-edit"
                  type="time"
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                />
              </div>
            </div>
          </MotionModal>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Breaks</CardTitle>
            <CardDescription>
              View-only schedule for members. Passes can only be issued during
              these scheduled times.
            </CardDescription>
          </CardHeader>
          <CardContent>{renderBreaksTable(false)}</CardContent>
        </Card>
      )}
    </div>
  );
}
