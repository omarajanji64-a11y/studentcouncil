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

export function CreatePassButton() {
  const { isBreakActive, activeBreak } = useBreakStatus();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [reason, setReason] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  const handleCreatePass = async () => {
    if (!activeBreak || !user) return;
    if (!studentName || !reason) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Student name and reason are required.",
      });
      return;
    }

    setIsCreating(true);
    try {
      await createPass({
        studentName,
        reason,
        issuedBy: user.name,
        expiresAt: activeBreak.endTime,
      });
      setIsCreating(false);
      setIsOpen(false);
      setStudentName("");
      setReason("");
      toast({
        title: "Pass Created",
        description: "A new canteen pass has been successfully issued.",
      });
    } catch (error) {
      setIsCreating(false);
      toast({
        variant: "destructive",
        title: "Pass Failed",
        description: "Unable to create the pass in Firestore.",
      });
    }
  };

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
      title="Issue New Canteen Pass"
      description={
        isBreakActive
          ? `This pass will be valid for the rest of the ${activeBreak?.name?.toLowerCase()}.`
          : "Pass creation is currently disabled as there is no active break."
      }
      contentClassName="sm:max-w-[425px]"
      footer={
        <Button
          type="submit"
          onClick={handleCreatePass}
          disabled={!isBreakActive || isCreating}
        >
          {isCreating && <Skeleton className="mr-2 h-4 w-4 rounded-full" />}
          Issue Pass
        </Button>
      }
    >
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="student" className="text-right">
            Student
          </Label>
          <Input
            id="student"
            placeholder="Name or ID"
            className="col-span-3"
            disabled={!isBreakActive}
            value={studentName}
            onChange={(event) => setStudentName(event.target.value)}
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="reason" className="text-right">
            Reason
          </Label>
          <Input
            id="reason"
            placeholder="e.g., Forgot lunch"
            className="col-span-3"
            disabled={!isBreakActive}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>
      </div>
    </MotionModal>
  );
}
