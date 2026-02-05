"use client";

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
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Break } from "@/lib/types";
import { format } from "date-fns";
import { createBreak, useBreaks } from "@/hooks/use-firestore";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { MotionModal } from "@/components/motion/motion-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { easing, durations } from "@/lib/animations";

export default function SchedulePage() {
  const { data: breaks, loading } = useBreaks();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const { toast } = useToast();

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

    await createBreak({
      name,
      startTime: start.getTime(),
      endTime: end.getTime(),
    });

    setIsOpen(false);
    setName("");
    setStartTime("");
    setEndTime("");
    toast({
      title: "Break created",
      description: "The schedule has been updated in real time.",
    });
  };

  return (
    <div>
      <PageHeader
        title="Break Scheduler"
        description="Manage daily break times for pass issuing."
      >
        <MotionModal
          open={isOpen}
          onOpenChange={setIsOpen}
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
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Breaks</CardTitle>
          <CardDescription>
            Passes can only be issued during these scheduled times.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-2/3 mx-auto" />
                      <Skeleton className="h-4 w-1/2 mx-auto" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : breaks.length ? (
                breaks.map((breakItem) => (
                <TableRow key={breakItem.id}>
                  <TableCell className="font-medium">{breakItem.name}</TableCell>
                  <TableCell>{format(new Date(breakItem.startTime), 'p')}</TableCell>
                  <TableCell>{format(new Date(breakItem.endTime), 'p')}</TableCell>
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
                  <TableCell>
                    <Button aria-haspopup="true" size="icon" variant="ghost">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  </TableCell>
                </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No breaks scheduled.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
