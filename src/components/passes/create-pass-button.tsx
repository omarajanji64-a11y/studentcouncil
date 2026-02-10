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

export function CreatePassButton() {
  const { isBreakActive, activeBreak } = useBreakStatus();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [studentGender, setStudentGender] = useState<"male" | "female" | "mixed" | "">("");
  const [reason, setReason] = useState("");
  const [passType, setPassType] = useState<
    "active_break" | "time_specified" | "community"
  >("active_break");
  const [durationMinutes, setDurationMinutes] = useState("30");
  const { toast } = useToast();
  const { user } = useAuth();

  const handleCreatePass = async () => {
    if (!user) return;
    if (!studentName || !reason) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Student name and reason are required.",
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

    if (passType === "active_break" && !activeBreak) {
      toast({
        variant: "destructive",
        title: "No active break",
        description: "Active Break passes require a live break window.",
      });
      return;
    }

    setIsCreating(true);
    try {
      const duration = Number(durationMinutes) || 30;
      const expiresAt =
        passType === "active_break" && activeBreak
          ? activeBreak.endTime
          : Date.now() + duration * 60 * 1000;
      await createPass({
        studentName,
        studentId: studentId || undefined,
        studentGender,
        reason,
        issuedBy: user.name,
        issuedById: user.uid,
        expiresAt,
        passType,
        durationMinutes: passType === "active_break" ? undefined : duration,
      }, user.uid);
      setIsCreating(false);
      setIsOpen(false);
      setStudentName("");
      setStudentId("");
      setStudentGender("");
      setReason("");
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
      onOpenChange={setIsOpen}
      trigger={
        <Button size="sm" className="gap-1">
          <PlusCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Create Pass</span>
        </Button>
      }
      title="Issue New Pass"
      description={
        passType === "active_break"
          ? isBreakActive
            ? `This pass will be valid for the rest of the ${activeBreak?.name?.toLowerCase()}.`
            : "Active Break passes require a live break window."
          : "Configure the duration for this pass type."
      }
      contentClassName="sm:max-w-[425px]"
      footer={
        <Button
          type="submit"
          onClick={handleCreatePass}
          disabled={isCreating}
        >
          {isCreating && <Skeleton className="mr-2 h-4 w-4 rounded-full" />}
          Issue Pass
        </Button>
      }
    >
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
          <Label htmlFor="pass-type" className="sm:text-right">
            Type
          </Label>
          <Select value={passType} onValueChange={(value) => setPassType(value as any)}>
            <SelectTrigger id="pass-type" className="sm:col-span-3">
              <SelectValue placeholder="Select pass type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active_break">Active Break</SelectItem>
              <SelectItem value="time_specified">Time-Specified</SelectItem>
              <SelectItem value="community">Community</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
          <Label htmlFor="pass-gender" className="sm:text-right">
            Gender
          </Label>
          <Select
            value={studentGender}
            onValueChange={(value) => setStudentGender(value as any)}
          >
            <SelectTrigger id="pass-gender" className="sm:col-span-3">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="mixed">Mixed</SelectItem>
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
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
          <Label htmlFor="student-id" className="sm:text-right">
            Student ID
          </Label>
          <Input
            id="student-id"
            placeholder="Optional ID"
            className="sm:col-span-3"
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
          <Label htmlFor="reason" className="sm:text-right">
            Reason
          </Label>
          <Input
            id="reason"
            placeholder="e.g., Forgot lunch"
            className="sm:col-span-3"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>
        {passType !== "active_break" ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
            <Label htmlFor="duration" className="sm:text-right">
              Duration (min)
            </Label>
            <Input
              id="duration"
              type="number"
              min={5}
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
