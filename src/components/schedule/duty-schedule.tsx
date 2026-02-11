"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarDays, PlusCircle, Users, X } from "lucide-react";
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

const dutyLocations = [
  "Girls elevator",
  "Girls boys stairs",
  "Girls girls stairs",
  "YKS elevator",
  "YKS girls",
  "Canteen",
];

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
    if (!user?.gender && !staff) return duties;
    const token =
      genderScope === "all"
        ? null
        : genderScope;
    return duties.filter((duty) => {
      const haystack = `${duty.location ?? ""} ${duty.title ?? ""}`.toLowerCase();
      const hasGender = haystack.includes("boys") || haystack.includes("girls");
      if (!hasGender) return true;
      if (!token) return true;
      return haystack.includes(token);
    });
  }, [duties, staff, user, genderScope]);

  const scopedDuties = useMemo(() => {
    if (scope === "personal" && user) {
      return genderFilteredDuties.filter((duty) => duty.memberIds.includes(user.uid));
    }
    return genderFilteredDuties;
  }, [genderFilteredDuties, scope, user]);

  const todayRange = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return { start: start.getTime(), end: end.getTime() };
  }, []);

  const todayDuties = useMemo(() => {
    return [...scopedDuties]
      .filter(
        (duty) =>
          duty.startTime <= todayRange.end && duty.endTime >= todayRange.start
      )
      .sort((a, b) => a.startTime - b.startTime);
  }, [scopedDuties, todayRange]);

  const openEditor = (duty?: Duty) => {
    if (!staff) return;
    if (duty) {
      setLocation(duty.location ?? "");
      setStartTime(format(new Date(duty.startTime), "yyyy-MM-dd'T'HH:mm"));
      setEndTime(format(new Date(duty.endTime), "yyyy-MM-dd'T'HH:mm"));
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
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
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

  const todayLabel = useMemo(() => format(new Date(), "PPPP"), []);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Duty Schedule
          </CardTitle>
          <CardDescription>
            Today: {todayLabel}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {staff ? (
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
        <div className="rounded-md border">
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
                    <TableCell className="text-muted-foreground">
                      {duty.memberNames?.length ? duty.memberNames.join(", ") : "Unassigned"}
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
                    No duties scheduled for today.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
                {dutyLocations.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
                {location && !dutyLocations.includes(location) ? (
                  <SelectItem value={location}>{location}</SelectItem>
                ) : null}
              </SelectContent>
            </Select>
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
