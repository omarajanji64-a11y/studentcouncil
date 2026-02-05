"use client";

import { useRequireAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

export default function NotificationsPage() {
  useRequireAuth("supervisor");

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
                <Input id="title" placeholder="e.g., Canteen Update" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" placeholder="Enter your announcement here..." />
            </div>
        </CardContent>
        <CardFooter>
            <Button className="ml-auto gap-2">
                <Send className="h-4 w-4" />
                Broadcast
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
