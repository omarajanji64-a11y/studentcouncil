"use client";

import { useState } from "react";
import { AlertTriangle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MotionModal } from "@/components/motion/motion-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useBreakStatus } from "@/hooks/use-break-status";
import { createPass } from "@/hooks/use-firestore";
import { isStaff } from "@/lib/permissions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function OverridePassButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [studentGender, setStudentGender] = useState<"male" | "female" | "">("");
  const [studentGrade, setStudentGrade] = useState("");
  const [permissionLocation, setPermissionLocation] = useState("Canteen");
  const [reason, setReason] = useState("");
  const [durationMode, setDurationMode] = useState<"end_of_break" | "specific">(
    "specific"
  );
  const [durationMinutes, setDurationMinutes] = useState("10");
  const { toast } = useToast();
  const { user } = useAuth();
  const { activeBreak, isBreakActive } = useBreakStatus();
  const resetForm = () => {
    setStudentName("");
    setStudentGender("");
    setStudentGrade("");
    setPermissionLocation("Canteen");
    setReason("");
    setDurationMinutes("10");
    setDurationMode("specific");
  };

  if (!isStaff(user)) return null;

  const handleOverride = async () => {
    if (!user) return;
    if (!studentName || !studentGrade.trim() || !permissionLocation.trim()) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Student name, grade, and permission location are required.",
      });
      return;
    }
    if (!studentGender) {
      toast({
        variant: "destructive",
        title: "Missing gender",
        description: "Please select the student's gender.",
      });
      return;
    }
    if (durationMode === "end_of_break" && !activeBreak) {
      toast({
        variant: "destructive",
        title: "No active break",
        description: "Break-end overrides require a live break window.",
      });
      return;
    }

    setIsCreating(true);
    try {
      const duration = Math.max(1, Number(durationMinutes) || 10);
      const resolvedExpiresAt =
        durationMode === "end_of_break" && activeBreak
          ? activeBreak.endTime
          : Date.now() + duration * 60 * 1000;
      await createPass(
        {
          studentName,
          studentGender,
          studentGrade: studentGrade.trim(),
          permissionLocation: permissionLocation.trim(),
          reason,
          issuedBy: user.name,
          issuedById: user.uid,
          expiresAt: resolvedExpiresAt,
          passType: "override",
          override: true,
          ...(durationMode === "specific" ? { durationMinutes: duration } : {}),
        },
        user.uid
      );
      setIsCreating(false);
      setIsOpen(false);
      resetForm();
      toast({
        title: "Override Created",
        description: "Emergency override pass has been issued.",
      });
    } catch (error) {
      setIsCreating(false);
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Unable to create the override pass.";
      toast({
        variant: "destructive",
        title: "Override Failed",
        description: message,
      });
    }
  };

  return (
    <MotionModal
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          resetForm();
        }
      }}
      trigger={
        <Button size="sm" variant="destructive" className="gap-1">
          <Shield className="h-4 w-4" />
          <span className="hidden sm:inline">Override</span>
        </Button>
      }
      title="Emergency Override"
      description={
        durationMode === "end_of_break"
          ? isBreakActive
            ? `This override lasts until the end of the ${activeBreak?.name?.toLowerCase()}.`
            : "Break-end overrides require a live break window."
          : "Set a specific duration for this override."
      }
      contentClassName="sm:max-w-[460px]"
      footer={
        <Button type="submit" variant="destructive" onClick={handleOverride} disabled={isCreating}>
          {isCreating && <Skeleton className="mr-2 h-4 w-4 rounded-full" />}
          Issue Override
        </Button>
      }
    >
      <div className="grid gap-4 py-4">
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4" />
            Emergency use only
          </div>
          <p className="mt-1 text-xs text-destructive/80">
            Overrides are logged with full details.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
          <Label htmlFor="override-student" className="sm:text-right">
            Student
          </Label>
          <Input
            id="override-student"
            placeholder="Name"
            className="sm:col-span-3"
            value={studentName}
            onChange={(event) => setStudentName(event.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
          <Label htmlFor="override-gender" className="sm:text-right">
            Gender
          </Label>
          <div className="flex flex-wrap gap-2 sm:col-span-3">
            <Button
              type="button"
              variant={studentGender === "male" ? "default" : "outline"}
              onClick={() => setStudentGender("male")}
            >
              Boy
            </Button>
            <Button
              type="button"
              variant={studentGender === "female" ? "default" : "outline"}
              onClick={() => setStudentGender("female")}
            >
              Girl
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
          <Label htmlFor="override-grade" className="sm:text-right">
            Grade
          </Label>
          <Input
            id="override-grade"
            placeholder="e.g., 10A"
            className="sm:col-span-3"
            value={studentGrade}
            onChange={(event) => setStudentGrade(event.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
          <Label htmlFor="override-duration" className="sm:text-right">
            Duration
          </Label>
          <Select
            value={durationMode}
            onValueChange={(value) => setDurationMode(value as "end_of_break" | "specific")}
          >
            <SelectTrigger id="override-duration" className="sm:col-span-3">
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="end_of_break">Until end of break</SelectItem>
              <SelectItem value="specific">Specific duration</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
          <Label htmlFor="override-location" className="sm:text-right">
            Location
          </Label>
          <Input
            id="override-location"
            placeholder="e.g., Canteen"
            className="sm:col-span-3"
            value={permissionLocation}
            onChange={(event) => setPermissionLocation(event.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
          <Label htmlFor="override-reason" className="sm:text-right">
            Reason
          </Label>
          <Input
            id="override-reason"
            placeholder="Optional"
            className="sm:col-span-3"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>
        {durationMode === "specific" ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
            <Label htmlFor="override-duration-mins" className="sm:text-right">
              Duration (min)
            </Label>
            <Input
              id="override-duration-mins"
              type="number"
              min={1}
              className="sm:col-span-3"
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(event.target.value)}
            />
          </div>
        ) : null}
      </div>
    </MotionModal>
  );
}
