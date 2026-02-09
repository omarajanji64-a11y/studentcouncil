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
import { createPass } from "@/hooks/use-firestore";
import { isStaff } from "@/lib/permissions";

export function OverridePassButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [reason, setReason] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  if (!isStaff(user)) return null;

  const handleOverride = async () => {
    if (!user) return;
    if (!studentName || !reason) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Student name and reason are required for overrides.",
      });
      return;
    }

    setIsCreating(true);
    try {
      const resolvedExpiresAt = expiresAt
        ? new Date(expiresAt).getTime()
        : Date.now() + 30 * 60 * 1000;
      await createPass(
        {
          studentName,
          studentId: studentId || undefined,
          reason,
          issuedBy: user.name,
          issuedById: user.uid,
          expiresAt: resolvedExpiresAt,
          passType: "override",
          override: true,
        },
        user.uid
      );
      setIsCreating(false);
      setIsOpen(false);
      setStudentName("");
      setStudentId("");
      setReason("");
      setExpiresAt("");
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
      onOpenChange={setIsOpen}
      trigger={
        <Button size="sm" variant="destructive" className="gap-1">
          <Shield className="h-4 w-4" />
          <span className="hidden sm:inline">Override</span>
        </Button>
      }
      title="Emergency Override"
      description="Bypasses all limits. Optional time override; defaults to 30 minutes."
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
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="override-student" className="text-right">
            Student
          </Label>
          <Input
            id="override-student"
            placeholder="Name"
            className="col-span-3"
            value={studentName}
            onChange={(event) => setStudentName(event.target.value)}
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="override-student-id" className="text-right">
            Student ID
          </Label>
          <Input
            id="override-student-id"
            placeholder="Optional ID"
            className="col-span-3"
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="override-reason" className="text-right">
            Reason
          </Label>
          <Input
            id="override-reason"
            placeholder="Required"
            className="col-span-3"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="override-expires" className="text-right">
            Expires At
          </Label>
          <Input
            id="override-expires"
            type="datetime-local"
            className="col-span-3"
            value={expiresAt}
            onChange={(event) => setExpiresAt(event.target.value)}
          />
        </div>
      </div>
    </MotionModal>
  );
}
