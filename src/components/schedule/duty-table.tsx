"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MotionModal } from "@/components/motion/motion-modal";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useBreaks, useDuties, useUsers, createDuty, updateDuty, deleteDuty } from "@/hooks/use-firestore";
import { canEditSchedule, isStaff } from "@/lib/permissions";
import type { Duty } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const dutyLocations = ["Front Counter", "Kitchen", "Dish Station", "Runner"];

type EditCell = {
  breakId: string;
  location: string;
  duty?: Duty;
};

export function DutyTable() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: breaks, loading: breaksLoading } = useBreaks();
  const { data: duties } = useDuties();
  const { data: users } = useUsers();
  const [activeCell, setActiveCell] = useState<EditCell | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draftAssignments, setDraftAssignments] = useState<Record<string, string[]>>({});

  const canEdit = canEditSchedule(user);
  const sortedBreaks = useMemo(
    () => [...breaks].sort((a, b) => a.startTime - b.startTime),
    [breaks]
  );

  const dutyMap = useMemo(() => {
    const map = new Map<string, Duty>();
    duties.forEach((duty) => {
      if (!duty.breakId || !duty.location) return;
      map.set(`${duty.breakId}:${duty.location}`, duty);
    });
    return map;
  }, [duties]);

  const memberMap = useMemo(
    () => new Map(users.map((member) => [member.uid, member.name])),
    [users]
  );

  const baseAssignments = useMemo(() => {
    const assignments: Record<string, string[]> = {};
    dutyLocations.forEach((location) => {
      sortedBreaks.forEach((breakItem) => {
        const duty = dutyMap.get(`${breakItem.id}:${location}`);
        assignments[`${breakItem.id}:${location}`] = duty?.memberIds ?? [];
      });
    });
    return assignments;
  }, [dutyMap, sortedBreaks]);

  const openEditor = (breakId: string, location: string) => {
    if (!canEdit) return;
    const key = `${breakId}:${location}`;
    setSelectedMemberIds(draftAssignments[key] ?? []);
    setActiveCell({ breakId, location, duty: dutyMap.get(key) });
  };

  const saveAssignment = async () => {
    if (!activeCell) return;
    const key = `${activeCell.breakId}:${activeCell.location}`;
    setDraftAssignments((prev) => ({
      ...prev,
      [key]: selectedMemberIds,
    }));
    setActiveCell(null);
  };

  const startEditing = () => {
    if (!canEdit) return;
    setDraftAssignments(baseAssignments);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setDraftAssignments({});
  };

  const saveAll = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const tasks: Promise<any>[] = [];
      dutyLocations.forEach((location) => {
        sortedBreaks.forEach((breakItem) => {
          const key = `${breakItem.id}:${location}`;
          const existing = dutyMap.get(key);
          const nextMembers = draftAssignments[key] ?? [];
          const nextNames = nextMembers.map((id) => memberMap.get(id) ?? id);
          if (existing && nextMembers.length === 0) {
            tasks.push(deleteDuty(existing.id, user.uid));
            return;
          }
          if (existing && JSON.stringify(existing.memberIds) !== JSON.stringify(nextMembers)) {
            tasks.push(updateDuty(existing.id, { memberIds: nextMembers, memberNames: nextNames }, user.uid));
            return;
          }
          if (!existing && nextMembers.length > 0) {
            tasks.push(
              createDuty(
                {
                  title: `${location} - ${breakItem.name}`,
                  startTime: breakItem.startTime,
                  endTime: breakItem.endTime,
                  memberIds: nextMembers,
                  memberNames: nextNames,
                  breakId: breakItem.id,
                  location,
                },
                user.uid
              )
            );
          }
        });
      });

      await Promise.all(tasks);
      toast({
        title: "Schedule saved",
        description: "All duty assignments have been updated.",
      });
      setIsEditing(false);
      setDraftAssignments({});
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: "Could not save schedule changes.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Duty Schedule</CardTitle>
          <CardDescription>
            {isStaff(user)
              ? "Supervisor view shows locations by break."
              : "Member view shows your assignments by break."}
          </CardDescription>
        </div>
        {canEdit ? (
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <Button size="sm" onClick={startEditing}>
                Edit Schedule
              </Button>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={cancelEditing}>
                  Cancel
                </Button>
                <Button size="sm" onClick={saveAll} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </>
            )}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue={isStaff(user) ? "supervisor" : "member"}>
          <TabsList>
            <TabsTrigger value="member">Member View</TabsTrigger>
            <TabsTrigger value="supervisor">Supervisor View</TabsTrigger>
          </TabsList>

          <TabsContent value="member">
            <div className="overflow-auto rounded-md border">
              <Table className="min-w-[760px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-40">Member</TableHead>
                    {sortedBreaks.map((breakItem) => (
                      <TableHead key={breakItem.id} className="min-w-[160px]">
                        {breakItem.name}{" "}
                        <span className="block text-xs text-muted-foreground">
                          {format(new Date(breakItem.startTime), "p")} -{" "}
                          {format(new Date(breakItem.endTime), "p")}
                        </span>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {breaksLoading ? (
                    <TableRow>
                      <TableCell colSpan={sortedBreaks.length + 1} className="h-24 text-center">
                        Loading breaks...
                      </TableCell>
                    </TableRow>
                  ) : users.length ? (
                    users.map((member) => (
                      <TableRow key={member.uid}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        {sortedBreaks.map((breakItem) => {
                          const assignedLocations = dutyLocations.filter((location) => {
                            const duty = dutyMap.get(`${breakItem.id}:${location}`);
                            return duty?.memberIds?.includes(member.uid);
                          });
                          return (
                            <TableCell key={`${member.uid}:${breakItem.id}`}>
                              {assignedLocations.length ? assignedLocations.join(", ") : "N/A"}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={sortedBreaks.length + 1} className="h-24 text-center">
                        No members found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="supervisor">
            <div className="overflow-auto rounded-md border">
              <Table className="min-w-[760px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-40">Location</TableHead>
                    {sortedBreaks.map((breakItem) => (
                      <TableHead key={breakItem.id} className="min-w-[160px]">
                        {breakItem.name}{" "}
                        <span className="block text-xs text-muted-foreground">
                          {format(new Date(breakItem.startTime), "p")} -{" "}
                          {format(new Date(breakItem.endTime), "p")}
                        </span>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {breaksLoading ? (
                    <TableRow>
                      <TableCell colSpan={sortedBreaks.length + 1} className="h-24 text-center">
                        Loading breaks...
                      </TableCell>
                    </TableRow>
                  ) : dutyLocations.map((location) => (
                    <TableRow key={location}>
                      <TableCell className="font-medium">{location}</TableCell>
                      {sortedBreaks.map((breakItem) => {
                        const duty = dutyMap.get(`${breakItem.id}:${location}`);
                        const draftKey = `${breakItem.id}:${location}`;
                        const draftNames = (draftAssignments[draftKey] ?? [])
                          .map((id) => memberMap.get(id) ?? id)
                          .join(", ");
                        return (
                          <TableCell key={`${location}:${breakItem.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto whitespace-normal text-left"
                              disabled={!canEdit || !isEditing}
                              onClick={() => openEditor(breakItem.id, location)}
                            >
                              {isEditing
                                ? draftNames || "Assign"
                                : duty?.memberNames?.length
                                ? duty.memberNames.join(", ")
                                : "Assign"}
                            </Button>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <MotionModal
        open={!!activeCell}
        onOpenChange={(open) => !open && setActiveCell(null)}
        title="Assign Members"
        description="Select members for this location and break."
        contentClassName="sm:max-w-[520px]"
        footer={
          <Button onClick={saveAssignment} disabled={!canEdit}>
            Save Assignment
          </Button>
        }
      >
        <div className="grid gap-3 py-2">
          {users.map((member) => (
            <label key={member.uid} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={selectedMemberIds.includes(member.uid)}
                onCheckedChange={(checked) => {
                  setSelectedMemberIds((prev) =>
                    checked
                      ? [...prev, member.uid]
                      : prev.filter((id) => id !== member.uid)
                  );
                }}
              />
              {member.name}
            </label>
          ))}
          {!users.length ? (
            <p className="text-sm text-muted-foreground">No members available.</p>
          ) : null}
          <div className="pt-2">
            <Label className="text-xs text-muted-foreground">
              Editing is limited to supervisors/admins or members with schedule editor access.
            </Label>
          </div>
        </div>
      </MotionModal>
    </Card>
  );
}
