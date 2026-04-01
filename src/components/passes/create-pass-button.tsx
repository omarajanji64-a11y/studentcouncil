"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle } from "lucide-react";
import { useBreakStatus } from "@/hooks/use-break-status";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { createPass } from "@/hooks/use-firestore";
import { useAuth } from "@/hooks/use-auth";
import { MotionModal } from "@/components/motion/motion-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { isStaff } from "@/lib/permissions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DEFAULT_DURATION_MINUTES = "10";
const PERMANENT_EXPIRY_MS = Date.UTC(2099, 11, 31, 23, 59, 59);

export function CreatePassButton() {
  const { isBreakActive, activeBreak } = useBreakStatus();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [studentGender, setStudentGender] = useState<"male" | "female" | "">("");
  const [durationMode, setDurationMode] = useState<"end_of_break" | "specific" | "permanent">(
    "specific"
  );
  const [durationMinutes, setDurationMinutes] = useState(DEFAULT_DURATION_MINUTES);
  const { toast } = useToast();
  const { user } = useAuth();

  const resetForm = () => {
    setStudentName("");
    setStudentGender("");
    setDurationMode("specific");
    setDurationMinutes(DEFAULT_DURATION_MINUTES);
  };

  const handleCreatePass = async () => {
    if (!user) return;
    if (!studentName.trim()) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Student name is required.",
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
        description: "Break-end passes require a live break window.",
      });
      return;
    }

    setIsCreating(true);
    try {
      const duration = Math.max(1, Number(durationMinutes) || 10);
      const expiresAt =
        durationMode === "end_of_break" && activeBreak
          ? activeBreak.endTime
          : durationMode === "permanent"
          ? PERMANENT_EXPIRY_MS
          : Date.now() + duration * 60 * 1000;

      await createPass(
        {
          studentName: studentName.trim(),
          studentGender,
          reason: "",
          issuedBy: user.name,
          issuedById: user.uid,
          expiresAt,
          passType:
            durationMode === "end_of_break"
              ? "active_break"
              : durationMode === "permanent"
              ? "permanent"
              : "time_specified",
          ...(durationMode === "specific" ? { durationMinutes: duration } : {}),
        },
        user.uid
      );

      setIsCreating(false);
      setIsOpen(false);
      resetForm();
      toast({
        title: "Pass Created",
        description: "A new pass has been successfully issued.",
      });
    } catch (error) {
      setIsCreating(false);
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Unable to create the pass in Firestore.";
      toast({
        variant: "destructive",
        title: "Pass Failed",
        description: message,
      });
    }
  };

  if (!isStaff(user)) return null;

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
        <Button size="sm" className="gap-1">
          <PlusCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Create Pass</span>
        </Button>
      }
      title="Issue New Pass"
      description={
        durationMode === "end_of_break"
          ? isBreakActive
            ? `This pass will be valid for the rest of the ${activeBreak?.name?.toLowerCase()}.`
            : "Break-end passes require a live break window."
          : durationMode === "permanent"
          ? "Permanent passes stay active until deleted."
          : "Set a specific duration for this pass."
      }
      contentClassName="sm:max-w-[425px]"
      footer={
        <Button type="submit" onClick={handleCreatePass} disabled={isCreating}>
          {isCreating && <Skeleton className="mr-2 h-4 w-4 rounded-full" />}
          Issue Pass
        </Button>
      }
    >
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
          <Label htmlFor="pass-gender" className="sm:text-right">
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
          <Label htmlFor="pass-duration" className="sm:text-right">
            Duration
          </Label>
          <Select
            value={durationMode}
            onValueChange={(value) =>
              setDurationMode(value as "end_of_break" | "specific" | "permanent")
            }
          >
            <SelectTrigger id="pass-duration" className="sm:col-span-3">
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="end_of_break">Until end of break</SelectItem>
              <SelectItem value="permanent">Permanent (until deleted)</SelectItem>
              <SelectItem value="specific">Specific duration</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
          <Label htmlFor="student" className="sm:text-right">
            Student
          </Label>
          <Input
            id="student"
            placeholder="Name"
            className="sm:col-span-3"
            value={studentName}
            onChange={(event) => setStudentName(event.target.value)}
          />
        </div>
        {durationMode === "specific" ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
            <Label htmlFor="duration" className="sm:text-right">
              Duration (min)
            </Label>
            <Input
              id="duration"
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
