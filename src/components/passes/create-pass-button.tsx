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

const DEFAULT_DURATION_MINUTES = 10;

export function CreatePassButton() {
  const { isBreakActive, activeBreak } = useBreakStatus();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [studentName, setStudentName] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  const resetForm = () => {
    setStudentName("");
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

    setIsCreating(true);
    try {
      const endsWithBreak = isBreakActive && !!activeBreak;
      const expiresAt = isBreakActive && activeBreak
        ? activeBreak.endTime
        : Date.now() + DEFAULT_DURATION_MINUTES * 60 * 1000;

      await createPass(
        {
          studentName: studentName.trim(),
          reason: "",
          issuedBy: user.name,
          issuedById: user.uid,
          expiresAt,
          passType: endsWithBreak ? "active_break" : "time_specified",
          ...(!endsWithBreak ? { durationMinutes: DEFAULT_DURATION_MINUTES } : {}),
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
        isBreakActive && activeBreak
          ? `Enter only the student's name. This pass will stay valid until the end of ${activeBreak.name.toLowerCase()}.`
          : `Enter only the student's name. Outside break time, passes last ${DEFAULT_DURATION_MINUTES} minutes by default.`
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
      </div>
    </MotionModal>
  );
}
