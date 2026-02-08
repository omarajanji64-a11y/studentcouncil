"use client";

import { useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { createComplaint, updateComplaint, useDuties } from "@/hooks/use-firestore";
import { storage } from "@/lib/firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

export function ComplaintForm() {
  const { user } = useAuth();
  const { data: duties } = useDuties();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

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
      const complaintId = await createComplaint(
        {
          studentId: user.uid,
          studentName: user.name,
          dutyId: activeDuty?.id ?? null,
          title,
          description,
        },
        user.uid
      );
      if (files.length && storage) {
        const uploads = await Promise.all(
          files.map(async (file) => {
            const path = `complaints/${complaintId}/${Date.now()}-${user.uid}-${file.name}`;
            const fileRef = ref(storage, path);
            const snap = await uploadBytes(fileRef, file, {
              contentType: file.type || "image/jpeg",
            });
            const url = await getDownloadURL(snap.ref);
            return {
              url,
              path,
              uploadedBy: user.uid,
              createdAt: Date.now(),
              contentType: file.type,
              size: file.size,
            };
          })
        );
        await updateComplaint(
          complaintId,
          { attachments: uploads },
          user.uid
        );
      }
      setTitle("");
      setDescription("");
      setFiles([]);
      if (inputRef.current) inputRef.current.value = "";
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
        <div className="grid gap-2">
          <Label htmlFor="complaint-photos">Add Photos (optional)</Label>
          <Input
            id="complaint-photos"
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={(event) => {
              const picked = Array.from(event.target.files ?? []);
              setFiles(picked);
            }}
          />
          {files.length ? (
            <div className="grid grid-cols-3 gap-2">
              {files.map((file) => (
                <div key={file.name} className="rounded-md border bg-muted/20 p-2 text-xs">
                  {file.name}
                </div>
              ))}
            </div>
          ) : null}
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
