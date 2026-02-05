"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Loader2 } from "lucide-react";
import { useBreakStatus } from "@/hooks/use-break-status";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function CreatePassButton() {
  const { isBreakActive, activeBreak } = useBreakStatus();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCreatePass = async () => {
    setIsCreating(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsCreating(false);
    setIsOpen(false);
    toast({
      title: "Pass Created",
      description: "A new canteen pass has been successfully issued.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <PlusCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Create Pass</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Issue New Canteen Pass</DialogTitle>
          <DialogDescription>
            {isBreakActive
              ? `This pass will be valid for the rest of the ${activeBreak?.name?.toLowerCase()}.`
              : "Pass creation is currently disabled as there is no active break."}
          </DialogDescription>
        </DialogHeader>
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
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleCreatePass}
            disabled={!isBreakActive || isCreating}
          >
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Issue Pass
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
