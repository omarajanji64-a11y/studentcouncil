"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { createComplaint, useDuties } from "@/hooks/use-firestore";

export function ComplaintForm() {
  const { user } = useAuth();
  const { data: duties } = useDuties({ enabled: !!user, realtime: false });
  const { toast } = useToast();
  const [targetGender, setTargetGender] = useState<"male" | "female" | "">("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDutyId, setSelectedDutyId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeDuty = useMemo(() => {
    const now = Date.now();
    if (!user) return null;
    return (
      duties.find(
        (duty) =>
          now >= duty.startTime &&
          now < duty.endTime &&
          duty.memberIds?.includes(user.uid)
      ) ?? null
    );
  }, [duties, user]);

  const dutyOptions = useMemo(() => {
    if (!user) return duties;
    const assigned = duties.filter((duty) => duty.memberIds?.includes(user.uid));
    return assigned.length ? assigned : duties;
  }, [duties, user]);

  useEffect(() => {
    setSelectedDutyId((current) => {
      if (activeDuty && current === "") return activeDuty.id;
      if (current && dutyOptions.some((duty) => duty.id === current)) return current;
      return dutyOptions[0]?.id ?? "";
    });
  }, [activeDuty, dutyOptions]);

  const selectedDuty = useMemo(
    () => dutyOptions.find((duty) => duty.id === selectedDutyId) ?? null,
    [dutyOptions, selectedDutyId]
  );

  const handleSubmit = async () => {
    if (!user) return;
    if (!title || !description) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Student name and description are required.",
      });
      return;
    }
    if (!targetGender) {
      toast({
        variant: "destructive",
        title: "Missing student type",
        description: "Please select Boy or Girl.",
      });
      return;
    }
    if (!selectedDuty) {
      toast({
        variant: "destructive",
        title: "Missing duty",
        description: "Select your duty before submitting the complaint.",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await createComplaint(
        {
          studentId: user.uid,
          studentName: user.name,
          targetGender,
          dutyId: selectedDuty.id,
          dutyLocation: selectedDuty.location ?? null,
          title,
          description,
        },
        user.uid
      );
      setTitle("");
      setDescription("");
      setTargetGender("");
      setSelectedDutyId(activeDuty?.id ?? selectedDuty.id);
      toast({
        title: "Complaint submitted",
        description: "Your complaint has been recorded.",
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Unable to submit the complaint.";
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit a Complaint</CardTitle>
        <CardDescription>
          Logged with your account and linked to your selected duty.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="complaint-gender">Boy / Girl</Label>
          <select
            id="complaint-gender"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={targetGender}
            onChange={(event) =>
              setTargetGender(event.target.value as any)
            }
          >
            <option value="">Select Boy or Girl</option>
            <option value="male">Boy</option>
            <option value="female">Girl</option>
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="complaint-duty">Duty</Label>
          <select
            id="complaint-duty"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={selectedDutyId}
            onChange={(event) => setSelectedDutyId(event.target.value)}
          >
            <option value="">
              {dutyOptions.length ? "Select duty" : "No duty available"}
            </option>
            {dutyOptions.map((duty) => (
              <option key={duty.id} value={duty.id}>
                {duty.title}
                {duty.location ? ` - ${duty.location}` : ""}
              </option>
            ))}
          </select>
          <div className="text-xs text-muted-foreground">
            {activeDuty
              ? `Active now: ${activeDuty.location ?? activeDuty.title}`
              : "No active duty right now."}
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="complaint-title">Student Name</Label>
          <Input
            id="complaint-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Student full name"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="complaint-description">Description</Label>
          <Input
            id="complaint-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What happened?"
          />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Student ID: {user?.uid ?? "N/A"}</span>
          <span>
            Duty: {selectedDuty?.location ?? selectedDuty?.title ?? "Not selected"}
          </span>
        </div>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          Submit Complaint
        </Button>
      </CardContent>
    </Card>
  );
}
