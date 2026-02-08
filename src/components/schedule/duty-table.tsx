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
import { useBreaks, useDuties, useUsers, createDuty, updateDuty } from "@/hooks/use-firestore";
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

  const openEditor = (breakId: string, location: string) => {
    if (!canEdit) return;
    const duty = dutyMap.get(`${breakId}:${location}`);
    setSelectedMemberIds(duty?.memberIds ?? []);
    setActiveCell({ breakId, location, duty });
  };

  const saveAssignment = async () => {
    if (!activeCell || !user) return;
    const breakItem = breaks.find((b) => b.id === activeCell.breakId);
    if (!breakItem) return;
    const memberNames = selectedMemberIds.map((id) => memberMap.get(id) ?? id);

    if (activeCell.duty) {
      await updateDuty(
        activeCell.duty.id,
        {
          memberIds: selectedMemberIds,
          memberNames,
        },
        user.uid
      );
    } else {
      await createDuty(
        {
          title: `${activeCell.location} - ${breakItem.name}`,
          startTime: breakItem.startTime,
          endTime: breakItem.endTime,
          memberIds: selectedMemberIds,
          memberNames,
          breakId: breakItem.id,
          location: activeCell.location,
        },
        user.uid
      );
    }

    toast({
      title: "Schedule updated",
      description: "Duty assignment has been saved.",
    });
    setActiveCell(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Duty Schedule</CardTitle>
        <CardDescription>
          {isStaff(user)
            ? "Supervisor view shows locations by break."
            : "Member view shows your assignments by break."}
        </CardDescription>
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
                        return (
                          <TableCell key={`${location}:${breakItem.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto whitespace-normal text-left"
                              disabled={!canEdit}
                              onClick={() => openEditor(breakItem.id, location)}
                            >
                              {duty?.memberNames?.length
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
