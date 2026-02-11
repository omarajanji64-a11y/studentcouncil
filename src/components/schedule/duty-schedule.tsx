"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarDays, Pencil, PlusCircle, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { MotionModal } from "@/components/motion/motion-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { createDuty, deleteDuty, updateDuty, useDuties, useUsers } from "@/hooks/use-firestore";
import { isStaff } from "@/lib/permissions";
import type { Duty } from "@/lib/types";

type EditorState = {
  open: boolean;
  duty: Duty | null;
};

type TimeSlot = {
  key: string;
  startTime: number;
  endTime: number;
};

type LocationRow = {
  key: string;
  value: string;
  label: string;
};

type SlotEditorState = {
  open: boolean;
  slot: TimeSlot | null;
  start: string;
  end: string;
};

type AssignmentEditorState = {
  open: boolean;
  duty: Duty | null;
  slot: TimeSlot | null;
  location: LocationRow | null;
  memberIds: string[];
};

const girlsDutyLocations = [
  "Girls elevator",
  "Girls boys stairs",
  "Girls girls stairs",
  "YKS elevator",
  "YKS girls",
  "Canteen",
];

const normalizeLocation = (value?: string) => (value ?? "").trim().toLowerCase();

const toTimeKey = (start: number, end: number) => {
  return `${format(new Date(start), "HH:mm")}-${format(new Date(end), "HH:mm")}`;
};

const toTimeLabel = (start: number, end: number) => {
  return `${format(new Date(start), "p")} - ${format(new Date(end), "p")}`;
};

const applyTime = (baseTimestamp: number, timeValue: string) => {
  const [hours, minutes] = timeValue.split(":").map(Number);
  const date = new Date(baseTimestamp);
  date.setHours(hours, minutes, 0, 0);
  return date.getTime();
};

export function DutyScheduleEditor() {
  const { user } = useAuth();
  const staff = isStaff(user);
  const { data: duties, loading, refresh } = useDuties({ enabled: !!user, realtime: false });
  const { data: users } = useUsers({ enabled: staff, realtime: false });
  const { toast } = useToast();
  const [editor, setEditor] = useState<EditorState>({ open: false, duty: null });
  const [scope, setScope] = useState<"personal" | "all">("personal");
  const [genderScope, setGenderScope] = useState<"all" | "boys" | "girls">("all");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [slotEditor, setSlotEditor] = useState<SlotEditorState>({
    open: false,
    slot: null,
    start: "",
    end: "",
  });
  const [assignmentEditor, setAssignmentEditor] = useState<AssignmentEditorState>({
    open: false,
    duty: null,
    slot: null,
    location: null,
    memberIds: [],
  });
  const activeLocations = useMemo(() => {
    if (genderScope === "girls") return girlsDutyLocations;
    if (genderScope === "boys") return [];
    return girlsDutyLocations;
  }, [genderScope]);

  const allowedLocationSet = useMemo(() => {
    if (genderScope === "all") {
      return new Set(girlsDutyLocations.map(normalizeLocation));
    }
    if (genderScope === "girls") {
      return new Set(girlsDutyLocations.map(normalizeLocation));
    }
    return new Set<string>();
  }, [genderScope]);

  const memberOptions = useMemo(
    () => users.map((member) => ({ id: member.uid, name: member.name })),
    [users]
  );

  useEffect(() => {
    if (staff) {
      setScope("all");
    }
  }, [staff]);

  useEffect(() => {
    if (staff) return;
    if (user?.gender === "male") {
      setGenderScope("boys");
      return;
    }
    if (user?.gender === "female") {
      setGenderScope("girls");
      return;
    }
    setGenderScope("all");
  }, [staff, user?.gender]);

  const genderFilteredDuties = useMemo(() => {
    if (genderScope === "all") return duties;
    return duties.filter((duty) => allowedLocationSet.has(normalizeLocation(duty.location)));
  }, [duties, genderScope, allowedLocationSet]);

  const scopedDuties = useMemo(() => {
    if (scope === "personal" && user) {
      return genderFilteredDuties.filter((duty) => duty.memberIds.includes(user.uid));
    }
    return genderFilteredDuties;
  }, [genderFilteredDuties, scope, user]);

  const todayDuties = useMemo(() => {
    return [...scopedDuties]
      .sort((a, b) => a.startTime - b.startTime);
  }, [scopedDuties]);

  const allViewDuties = useMemo(() => {
    return [...genderFilteredDuties].sort((a, b) => a.startTime - b.startTime);
  }, [genderFilteredDuties]);

  const timeSlots = useMemo<TimeSlot[]>(() => {
    const slotMap = new Map<string, TimeSlot>();
    duties.forEach((duty) => {
      const key = toTimeKey(duty.startTime, duty.endTime);
      if (!slotMap.has(key)) {
        slotMap.set(key, {
          key,
          startTime: duty.startTime,
          endTime: duty.endTime,
        });
      }
    });
    return Array.from(slotMap.values()).sort((a, b) => a.startTime - b.startTime);
  }, [duties]);

  const locationRows = useMemo<LocationRow[]>(() => {
    return activeLocations.map((location) => ({
      key: normalizeLocation(location),
      value: location,
      label: location,
    }));
  }, [activeLocations]);

  const dutyGrid = useMemo(() => {
    const map = new Map<string, Duty>();
    allViewDuties.forEach((duty) => {
      const locationKey = normalizeLocation(duty.location);
      const slotKey = toTimeKey(duty.startTime, duty.endTime);
      map.set(`${locationKey}||${slotKey}`, duty);
    });
    return map;
  }, [allViewDuties]);

  const openEditor = (duty?: Duty) => {
    if (!staff) return;
    if (duty) {
      setLocation(duty.location ?? "");
      setStartTime(format(new Date(duty.startTime), "HH:mm"));
      setEndTime(format(new Date(duty.endTime), "HH:mm"));
      setMemberIds(duty.memberIds);
    } else {
      setLocation("");
      setStartTime("");
      setEndTime("");
      setMemberIds([]);
    }
    setEditor({ open: true, duty: duty ?? null });
  };

  const handleSave = async () => {
    if (!staff || !user) return;
    if (!startTime || !endTime || !location.trim()) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Location, start time, and end time are required.",
      });
      return;
    }
    const baseStart = editor.duty?.startTime ?? Date.now();
    const baseEnd = editor.duty?.endTime ?? Date.now();
    const start = applyTime(baseStart, startTime);
    const end = applyTime(baseEnd, endTime);
    const memberNames = memberOptions
      .filter((option) => memberIds.includes(option.id))
      .map((option) => option.name);
    const locationValue = location.trim();
    const derivedTitle = locationValue;
    if (editor.duty) {
      const update: Partial<Duty> = {
        title: derivedTitle,
        startTime: start,
        endTime: end,
        memberIds,
        memberNames,
        location: locationValue,
      };
      await updateDuty(
        editor.duty.id,
        update,
        user.uid
      );
      refresh?.();
      toast({ title: "Duty updated", description: "Shift has been updated." });
    } else {
      const createPayload: Omit<Duty, "id"> = {
        title: derivedTitle,
        startTime: start,
        endTime: end,
        memberIds,
        memberNames,
        location: locationValue,
      };
      await createDuty(
        createPayload,
        user.uid
      );
      refresh?.();
      toast({ title: "Duty created", description: "New duty shift added." });
    }
    setEditor({ open: false, duty: null });
  };

  const handleDelete = async (dutyId: string) => {
    if (!staff || !user) return;
    await deleteDuty(dutyId, user.uid);
    refresh?.();
    toast({ title: "Duty deleted", description: "Duty has been removed." });
  };

  const openSlotEditor = (slot: TimeSlot) => {
    if (!staff) return;
    setSlotEditor({
      open: true,
      slot,
      start: format(new Date(slot.startTime), "HH:mm"),
      end: format(new Date(slot.endTime), "HH:mm"),
    });
  };

  const handleSaveSlot = async () => {
    if (!staff || !user) return;
    if (!slotEditor.start || !slotEditor.end) {
      toast({
        variant: "destructive",
        title: "Missing times",
        description: "Start and end times are required.",
      });
      return;
    }
    if (!slotEditor.slot) {
      if (!activeLocations.length) {
        toast({
          variant: "destructive",
          title: "No locations",
          description: "Add duty locations before creating a time slot.",
        });
        return;
      }
      const start = applyTime(Date.now(), slotEditor.start);
      const end = applyTime(Date.now(), slotEditor.end);
      const baseLocation = activeLocations[0];
      await createDuty(
        {
          title: baseLocation,
          startTime: start,
          endTime: end,
          memberIds: [],
          memberNames: [],
          location: baseLocation,
        },
        user.uid
      );
    } else {
      const affected = allViewDuties.filter(
        (duty) => toTimeKey(duty.startTime, duty.endTime) === slotEditor.slot?.key
      );
      await Promise.all(
        affected.map((duty) =>
          updateDuty(
            duty.id,
            {
              startTime: applyTime(duty.startTime, slotEditor.start),
              endTime: applyTime(duty.endTime, slotEditor.end),
            },
            user.uid
          )
        )
      );
    }
    refresh?.();
    setSlotEditor({ open: false, slot: null, start: "", end: "" });
    toast({ title: "Time updated", description: "Duty times updated for this column." });
  };

  const openAssignmentEditor = (
    locationRow: LocationRow,
    slot: TimeSlot,
    duty?: Duty
  ) => {
    if (!staff) return;
    setAssignmentEditor({
      open: true,
      duty: duty ?? null,
      slot,
      location: locationRow,
      memberIds: duty?.memberIds ?? [],
    });
  };

  const handleSaveAssignment = async () => {
    if (!staff || !user || !assignmentEditor.slot || !assignmentEditor.location) return;
    const memberNames = memberOptions
      .filter((option) => assignmentEditor.memberIds.includes(option.id))
      .map((option) => option.name);
    const locationValue = assignmentEditor.location.value;
    const titleValue = locationValue || assignmentEditor.location.label;
    if (assignmentEditor.duty) {
      await updateDuty(
        assignmentEditor.duty.id,
        {
          memberIds: assignmentEditor.memberIds,
          memberNames,
          location: locationValue,
          title: titleValue,
        },
        user.uid
      );
    } else {
      await createDuty(
        {
          title: titleValue,
          startTime: assignmentEditor.slot.startTime,
          endTime: assignmentEditor.slot.endTime,
          memberIds: assignmentEditor.memberIds,
          memberNames,
          location: locationValue,
        },
        user.uid
      );
    }
    refresh?.();
    setAssignmentEditor({
      open: false,
      duty: null,
      slot: null,
      location: null,
      memberIds: [],
    });
    toast({ title: "Assignment saved", description: "Duty assignment updated." });
  };

  const openNewSlotEditor = () => {
    if (!staff) return;
    if (!activeLocations.length) {
      toast({
        variant: "destructive",
        title: "No locations",
        description: "This view has no preset duty locations.",
      });
      return;
    }
    setSlotEditor({ open: true, slot: null, start: "", end: "" });
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Duty Schedule
          </CardTitle>
          <CardDescription>Daily duty schedule (time only).</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {staff && scope === "all" ? (
            <Button size="sm" className="gap-1" onClick={openNewSlotEditor}>
              <PlusCircle className="h-4 w-4" />
              Add Time Slot
            </Button>
          ) : null}
          {staff && scope === "personal" ? (
            <Button size="sm" className="gap-1" onClick={() => openEditor()}>
              <PlusCircle className="h-4 w-4" />
              New Duty
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Tabs value={scope} onValueChange={(value) => setScope(value as any)}>
            <TabsList>
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
          {staff ? (
            <Tabs
              value={genderScope}
              onValueChange={(value) => setGenderScope(value as any)}
            >
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="boys">Boys</TabsTrigger>
                <TabsTrigger value="girls">Girls</TabsTrigger>
              </TabsList>
            </Tabs>
          ) : null}
        </div>
        <div className="rounded-md border overflow-x-auto">
          {scope === "all" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Duty Place</TableHead>
                  {timeSlots.map((slot) => (
                    <TableHead key={slot.key} className="min-w-[160px] text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-medium">
                          {toTimeLabel(slot.startTime, slot.endTime)}
                        </span>
                        {staff ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() => openSlotEditor(slot)}
                          >
                            <Pencil className="mr-1 h-3 w-3" />
                            Edit time
                          </Button>
                        ) : null}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={Math.max(1, timeSlots.length + 1)}
                      className="h-20 text-center text-sm text-muted-foreground"
                    >
                      Loading duties...
                    </TableCell>
                  </TableRow>
                ) : timeSlots.length && locationRows.length ? (
                  locationRows.map((row) => (
                    <TableRow key={row.key}>
                      <TableCell className="font-medium">{row.label}</TableCell>
                      {timeSlots.map((slot) => {
                        const key = `${row.key}||${slot.key}`;
                        const duty = dutyGrid.get(key);
                        return (
                          <TableCell key={key} className="align-top text-center">
                            {duty?.memberNames?.length ? (
                              <div className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                                {duty.memberNames.join(", ")}
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground">Unassigned</div>
                            )}
                            {staff ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="mt-2 h-7 px-2 text-xs"
                                onClick={() => openAssignmentEditor(row, slot, duty)}
                              >
                                Assign
                              </Button>
                            ) : null}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={Math.max(1, timeSlots.length + 1)}
                      className="h-20 text-center text-sm text-muted-foreground"
                    >
                      No duties scheduled.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Duty</TableHead>
                  <TableHead>Members</TableHead>
                  {staff ? <TableHead className="text-right">Actions</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={staff ? 5 : 4} className="h-20 text-center text-sm text-muted-foreground">
                      Loading duties...
                    </TableCell>
                  </TableRow>
                ) : todayDuties.length ? (
                  todayDuties.map((duty) => (
                    <TableRow key={duty.id}>
                      <TableCell className="font-medium">
                        {format(new Date(duty.startTime), "p")} - {format(new Date(duty.endTime), "p")}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{duty.location ?? "Unspecified"}</div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {duty.title ?? "—"}
                      </TableCell>
                      <TableCell>
                        {duty.memberNames?.length ? (
                          <span className="font-semibold text-slate-950 dark:text-slate-100">
                            {duty.memberNames.join(", ")}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      {staff ? (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => openEditor(duty)}
                            >
                              <span className="sr-only">Edit</span>
                              <Users className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive"
                              onClick={() => handleDelete(duty.id)}
                            >
                              <span className="sr-only">Delete</span>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={staff ? 5 : 4} className="h-20 text-center text-sm text-muted-foreground">
                      No duties scheduled.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
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
            <Label htmlFor="duty-location">Location</Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger id="duty-location">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {activeLocations.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="duty-start">Start</Label>
            <Input
              id="duty-start"
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="duty-end">End</Label>
            <Input
              id="duty-end"
              type="time"
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

      <MotionModal
        open={slotEditor.open}
        onOpenChange={(open) => setSlotEditor((prev) => ({ ...prev, open }))}
        title={slotEditor.slot ? "Edit Duty Time" : "Add Time Slot"}
        description="Set the time range for this duty column."
        contentClassName="sm:max-w-[420px]"
        footer={<Button onClick={handleSaveSlot}>Save Time</Button>}
      >
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="slot-start">Start</Label>
            <Input
              id="slot-start"
              type="time"
              value={slotEditor.start}
              onChange={(event) =>
                setSlotEditor((prev) => ({ ...prev, start: event.target.value }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="slot-end">End</Label>
            <Input
              id="slot-end"
              type="time"
              value={slotEditor.end}
              onChange={(event) =>
                setSlotEditor((prev) => ({ ...prev, end: event.target.value }))
              }
            />
          </div>
        </div>
      </MotionModal>

      <MotionModal
        open={assignmentEditor.open}
        onOpenChange={(open) => setAssignmentEditor((prev) => ({ ...prev, open }))}
        title="Assign Members"
        description="Assign members to this duty slot."
        contentClassName="sm:max-w-[520px]"
        footer={<Button onClick={handleSaveAssignment}>Save Assignment</Button>}
      >
        <div className="grid gap-4 py-4">
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
            <div className="font-medium">
              {assignmentEditor.location?.label ?? "Location"}
            </div>
            <div className="text-muted-foreground">
              {assignmentEditor.slot
                ? toTimeLabel(assignmentEditor.slot.startTime, assignmentEditor.slot.endTime)
                : ""}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Members</Label>
            <div className="grid gap-2">
              {memberOptions.length ? (
                memberOptions.map((member) => (
                  <label key={member.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={assignmentEditor.memberIds.includes(member.id)}
                      onCheckedChange={(checked) => {
                        setAssignmentEditor((prev) => ({
                          ...prev,
                          memberIds: checked
                            ? [...prev.memberIds, member.id]
                            : prev.memberIds.filter((id) => id !== member.id),
                        }));
                      }}
                    />
                    {member.name}
                  </label>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No members found.</div>
              )}
            </div>
          </div>
        </div>
      </MotionModal>
    </Card>
  );
}
