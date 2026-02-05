"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              New Break
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Schedule a Break</DialogTitle>
              <DialogDescription>
                Breaks are synced to Firestore and update in real time.
              </DialogDescription>
            </DialogHeader>
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
            <DialogFooter>
              <Button onClick={handleCreateBreak}>Save Break</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
                    Loading breaks...
                  </TableCell>
                </TableRow>
              ) : breaks.length ? (
                breaks.map((breakItem) => (
                <TableRow key={breakItem.id}>
                  <TableCell className="font-medium">{breakItem.name}</TableCell>
                  <TableCell>{format(new Date(breakItem.startTime), 'p')}</TableCell>
                  <TableCell>{format(new Date(breakItem.endTime), 'p')}</TableCell>
                  <TableCell>
                    {isBreakActive(breakItem) ? (
                      <Badge className="bg-green-500">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
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
