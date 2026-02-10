"use client";

import { useEffect, useMemo, useState } from "react";
import { format, addDays, addMonths, startOfWeek, startOfMonth, endOfMonth, endOfWeek, isSameMonth, isSameDay } from "date-fns";
import { CalendarDays, PlusCircle, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { MotionModal } from "@/components/motion/motion-modal";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { createDuty, deleteDuty, updateDuty, useDuties, useUsers } from "@/hooks/use-firestore";
import { isStaff } from "@/lib/permissions";
import type { Duty } from "@/lib/types";
import { cn } from "@/lib/utils";

type EditorState = {
  open: boolean;
  duty: Duty | null;
};

const buildDateKey = (date: Date) => format(date, "yyyy-MM-dd");

export function DutyScheduleEditor() {
  const { user } = useAuth();
  const staff = isStaff(user);
  const { data: duties, loading } = useDuties({ enabled: !!user, realtime: staff });
  const { data: users } = useUsers({ enabled: staff, realtime: staff });
  const { toast } = useToast();
  const [view, setView] = useState<"day" | "week" | "month">("week");
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [editor, setEditor] = useState<EditorState>({ open: false, duty: null });
  const [scope, setScope] = useState<"personal" | "all">("personal");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [memberIds, setMemberIds] = useState<string[]>([]);

  const memberOptions = useMemo(
    () => users.map((member) => ({ id: member.uid, name: member.name })),
    [users]
  );

  useEffect(() => {
    if (staff) {
      setScope("all");
    }
  }, [staff]);

  const genderFilteredDuties = useMemo(() => {
    if (staff || !user?.gender) return duties;
    const token = user.gender === "male" ? "boys" : "girls";
    return duties.filter((duty) => {
      const haystack = `${duty.location ?? ""} ${duty.title ?? ""}`.toLowerCase();
      const hasGender = haystack.includes("boys") || haystack.includes("girls");
      if (!hasGender) return true;
      return haystack.includes(token);
    });
  }, [duties, staff, user]);

  const scopedDuties = useMemo(() => {
    if (scope === "personal" && user) {
      return genderFilteredDuties.filter((duty) => duty.memberIds.includes(user.uid));
    }
    return genderFilteredDuties;
  }, [genderFilteredDuties, scope, user]);

  const dutiesByDay = useMemo(() => {
    const sorted = [...scopedDuties].sort((a, b) => a.startTime - b.startTime);
    const map = new Map<string, Duty[]>();
    sorted.forEach((duty) => {
      const key = buildDateKey(new Date(duty.startTime));
      if (!map.has(key)) map.set(key, []);
      map.set(key, [...(map.get(key) ?? []), duty]);
    });
    return map;
  }, [scopedDuties]);

  const openEditor = (duty?: Duty) => {
    if (!staff) return;
    if (duty) {
      setTitle(duty.title);
      setLocation(duty.location ?? "");
      setStartTime(format(new Date(duty.startTime), "yyyy-MM-dd'T'HH:mm"));
      setEndTime(format(new Date(duty.endTime), "yyyy-MM-dd'T'HH:mm"));
      setMemberIds(duty.memberIds);
    } else {
      setTitle("");
      setLocation("");
      setStartTime("");
      setEndTime("");
      setMemberIds([]);
    }
    setEditor({ open: true, duty: duty ?? null });
  };

  const handleSave = async () => {
    if (!staff || !user) return;
    if (!title || !startTime || !endTime) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Title, start time, and end time are required.",
      });
      return;
    }
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const memberNames = memberOptions
      .filter((option) => memberIds.includes(option.id))
      .map((option) => option.name);
    const locationValue = location.trim();
    if (editor.duty) {
      const update: Partial<Duty> = {
        title,
        startTime: start,
        endTime: end,
        memberIds,
        memberNames,
      };
      if (locationValue) update.location = locationValue;
      await updateDuty(
        editor.duty.id,
        update,
        user.uid
      );
      toast({ title: "Duty updated", description: "Shift has been updated." });
    } else {
      const createPayload: Omit<Duty, "id"> = {
        title,
        startTime: start,
        endTime: end,
        memberIds,
        memberNames,
        ...(locationValue ? { location: locationValue } : {}),
      };
      await createDuty(
        createPayload,
        user.uid
      );
      toast({ title: "Duty created", description: "New duty shift added." });
    }
    setEditor({ open: false, duty: null });
  };

  const handleDelete = async (dutyId: string) => {
    if (!staff || !user) return;
    await deleteDuty(dutyId, user.uid);
    toast({ title: "Duty deleted", description: "Duty has been removed." });
  };

  const handleDrop = async (date: Date, dutyId?: string) => {
    if (!staff || !user || !dutyId) return;
    const duty = duties.find((item) => item.id === dutyId);
    if (!duty) return;
    const start = new Date(duty.startTime);
    const end = new Date(duty.endTime);
    const target = new Date(date);
    const diffMinutes = (end.getTime() - start.getTime()) / 60000;
    target.setHours(start.getHours(), start.getMinutes(), 0, 0);
    const newStart = target.getTime();
    const newEnd = newStart + diffMinutes * 60 * 1000;
    await updateDuty(dutyId, { startTime: newStart, endTime: newEnd }, user.uid);
  };

  const dayRange = useMemo(() => {
    if (view === "day") return [anchorDate];
    if (view === "week") {
      const start = startOfWeek(anchorDate, { weekStartsOn: 1 });
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }
    const start = startOfWeek(startOfMonth(anchorDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(anchorDate), { weekStartsOn: 1 });
    const days = [];
    let cursor = start;
    while (cursor <= end) {
      days.push(cursor);
      cursor = addDays(cursor, 1);
    }
    return days;
  }, [anchorDate, view]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Duty Schedule
          </CardTitle>
          <CardDescription>Plan shifts, assign members, and drag duties across days.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setAnchorDate((prev) =>
                view === "month" ? addMonths(prev, -1) : addDays(prev, view === "week" ? -7 : -1)
              )
            }
          >
            Prev
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAnchorDate(new Date())}>
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setAnchorDate((prev) =>
                view === "month" ? addMonths(prev, 1) : addDays(prev, view === "week" ? 7 : 1)
              )
            }
          >
            Next
          </Button>
          {staff ? (
            <Button size="sm" className="gap-1" onClick={() => openEditor()}>
              <PlusCircle className="h-4 w-4" />
              New Duty
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={view} onValueChange={(value) => setView(value as any)}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Tabs value={scope} onValueChange={(value) => setScope(value as any)}>
              <TabsList>
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
            </Tabs>
            <TabsList>
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value={view}>
            <div
              className={cn(
                "grid gap-3",
                view === "month"
                  ? "grid-cols-2 sm:grid-cols-4 lg:grid-cols-7"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              )}
            >
              {dayRange.map((date) => {
                const key = buildDateKey(date);
                const dailyDuties = dutiesByDay.get(key) ?? [];
                return (
                  <div
                    key={key}
                    className={cn(
                      "rounded-lg border bg-muted/20 p-3",
                      view === "month" && !isSameMonth(date, anchorDate) && "opacity-50"
                    )}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      const dutyId = event.dataTransfer.getData("text/plain");
                      handleDrop(date, dutyId);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">
                        {format(date, view === "month" ? "MMM d" : "EEE, MMM d")}
                      </p>
                      {isSameDay(date, new Date()) ? (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          Today
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-3 space-y-2">
                      {loading ? (
                        <div className="text-xs text-muted-foreground">Loading...</div>
                      ) : dailyDuties.length ? (
                        dailyDuties.map((duty) => (
                          <div
                            key={duty.id}
                            draggable={staff}
                            onDragStart={(event) => event.dataTransfer.setData("text/plain", duty.id)}
                            className="rounded-md border bg-background p-2 text-xs shadow-sm"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <p className="font-semibold">
                                  {duty.location ?? duty.title}
                                </p>
                                {duty.location && duty.title && duty.location !== duty.title ? (
                                  <p className="text-[10px] text-muted-foreground">
                                    {duty.title}
                                  </p>
                                ) : null}
                              </div>
                              {staff ? (
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6"
                                    onClick={() => openEditor(duty)}
                                  >
                                    <span className="sr-only">Edit</span>
                                    <Users className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 text-destructive"
                                    onClick={() => handleDelete(duty.id)}
                                  >
                                    <span className="sr-only">Delete</span>
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ) : null}
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              {format(new Date(duty.startTime), "p")} - {format(new Date(duty.endTime), "p")}
                            </p>
                            {duty.memberNames?.length ? (
                              <p className="mt-1 text-[11px] text-muted-foreground">
                                {duty.memberNames.join(", ")}
                              </p>
                            ) : (
                              <p className="mt-1 text-[11px] text-muted-foreground">
                                No members assigned
                              </p>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-muted-foreground">No duties</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <MotionModal
        open={editor.open}
        onOpenChange={(open) => setEditor((prev) => ({ ...prev, open }))}
        title={editor.duty ? "Edit Duty" : "Create Duty"}
        description="Assign members and define shift timing."
        contentClassName="sm:max-w-[520px]"
        footer={
          <Button onClick={handleSave}>
            {editor.duty ? "Save Changes" : "Create Duty"}
          </Button>
        }
      >
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="duty-title">Title</Label>
            <Input
              id="duty-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g., Front Counter"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="duty-location">Location (optional)</Label>
            <Input
              id="duty-location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="e.g., 4th floor boys staircase"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="duty-start">Start</Label>
            <Input
              id="duty-start"
              type="datetime-local"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="duty-end">End</Label>
            <Input
              id="duty-end"
              type="datetime-local"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Assign Members</Label>
            <div className="grid gap-2">
              {memberOptions.map((member) => (
                <label key={member.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={memberIds.includes(member.id)}
                    onCheckedChange={(checked) => {
                      setMemberIds((prev) =>
                        checked ? [...prev, member.id] : prev.filter((id) => id !== member.id)
                      );
                    }}
                  />
                  {member.name}
                </label>
              ))}
            </div>
          </div>
        </div>
      </MotionModal>
    </Card>
  );
}
