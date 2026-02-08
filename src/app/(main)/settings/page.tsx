"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  saveNotificationToken,
  updateUserNotificationSettings,
  upsertUserProfile,
} from "@/hooks/use-firestore";
import { useToast } from "@/hooks/use-toast";
import { registerForPushNotifications } from "@/lib/push";
import { useState } from "react";

export default function SettingsPage() {
  const { user, updateDisplayName } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [isSavingName, setIsSavingName] = useState(false);

  if (!user) return null;

  const handleNotificationsToggle = async (enabled: boolean) => {
    if (!enabled || user.notificationsEnabled) return;
    setIsUpdating(true);
    try {
      const token = await registerForPushNotifications();
      await saveNotificationToken(user.uid, token);
      await updateUserNotificationSettings(user.uid, true, user.uid);
      toast({
        title: "Notifications enabled",
        description: "You're all set for real-time alerts.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description:
          error instanceof Error
            ? error.message
            : "Could not save your notification preference.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveName = async () => {
    if (!user) return;
    if (!name.trim()) {
      toast({
        variant: "destructive",
        title: "Name required",
        description: "Please enter your name before saving.",
      });
      return;
    }
    setIsSavingName(true);
    try {
      await updateDisplayName(name.trim());
      await upsertUserProfile({ ...user, name: name.trim() });
      toast({
        title: "Name updated",
        description: "Your display name has been saved.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "Could not update your name.",
      });
    } finally {
      setIsSavingName(false);
    }
  };

  return (
    <div className="container mx-auto px-0">
      <PageHeader
        title="Settings"
        description="Manage your account preferences."
      />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your account display name.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <Label htmlFor="display-name">Display Name</Label>
            <Input
              id="display-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2"
            />
          </div>
          <Button onClick={handleSaveName} disabled={isSavingName}>
            {isSavingName ? "Saving..." : "Save Name"}
          </Button>
        </CardContent>
      </Card>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Control whether you receive broadcast announcements.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="notifications-toggle">Enable notifications</Label>
            <p className="text-sm text-muted-foreground">
              When enabled, you will see real-time announcements.
            </p>
          </div>
          <Switch
            id="notifications-toggle"
            checked={user.notificationsEnabled ?? false}
            onCheckedChange={handleNotificationsToggle}
            disabled={user.notificationsEnabled || isUpdating}
          />
        </CardContent>
      </Card>
    </div>
  );
}
