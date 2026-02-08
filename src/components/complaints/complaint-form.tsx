"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { createComplaint, useDuties } from "@/hooks/use-firestore";

export function ComplaintForm() {
  const { user } = useAuth();
  const { data: duties } = useDuties();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeDuty = useMemo(() => {
    const now = Date.now();
    return duties.find((duty) => now >= duty.startTime && now < duty.endTime) ?? null;
  }, [duties]);

  const handleSubmit = async () => {
    if (!user) return;
    if (!title || !description) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Title and description are required.",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await createComplaint(
        {
          studentId: user.uid,
          studentName: user.name,
          dutyId: activeDuty?.id ?? null,
          title,
          description,
        },
        user.uid
      );
      setTitle("");
      setDescription("");
      toast({
        title: "Complaint submitted",
        description: "Your complaint has been recorded.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: "Unable to submit the complaint.",
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
          Logged with your account and linked to the active duty.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="complaint-title">Title</Label>
          <Input
            id="complaint-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Short summary"
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
          <span>Duty: {activeDuty?.title ?? "No active duty"}</span>
        </div>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          Submit Complaint
        </Button>
      </CardContent>
    </Card>
  );
}
