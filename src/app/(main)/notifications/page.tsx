"use client";

import { useRequireAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { useState } from "react";
import { createNotification } from "@/hooks/use-firestore";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationsPage() {
  useRequireAuth("supervisor");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSend = async () => {
    if (!title || !message) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Add a title and message before sending.",
      });
      return;
    }
    if (!user) {
      toast({
        variant: "destructive",
        title: "Not signed in",
        description: "Please sign in again.",
      });
      return;
    }
    setIsSending(true);
    try {
      await createNotification({
        title,
        message,
        senderId: user.uid,
        senderName: user.name,
        senderRole: user.role,
      });
      setTitle("");
      setMessage("");
      toast({
        title: "Notification sent",
        description: "Your announcement is now live.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Send failed",
        description: "Could not publish the notification.",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Send Notification"
        description="Broadcast an announcement to all staff members."
      />
      <Card className="max-w-2xl">
        <CardHeader>
            <CardTitle>New Announcement</CardTitle>
            <CardDescription>This message will be sent as a real-time notification.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Council Update"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Enter your announcement here..."
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                />
            </div>
        </CardContent>
        <CardFooter>
            <Button className="ml-auto gap-2" onClick={handleSend} disabled={isSending}>
                {isSending && <Skeleton className="h-4 w-4 rounded-full" />}
                <Send className="h-4 w-4" />
                Broadcast
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
