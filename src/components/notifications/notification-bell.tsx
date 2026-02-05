"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import {
  markNotificationsRead,
  useNotificationReads,
  useNotifications,
} from "@/hooks/use-firestore";
import { useAuth } from "@/hooks/use-auth";
import { useMemo, useState } from "react";

export function NotificationBell() {
  const { user } = useAuth();
  const notificationsEnabled = user?.notificationsEnabled ?? false;
  const { data: notifications, loading } = useNotifications(notificationsEnabled);
  const { data: reads } = useNotificationReads(user?.uid);
  const [open, setOpen] = useState(false);

  const readIds = useMemo(() => new Set(reads.map((read) => read.id)), [reads]);
  const unreadNotifications = notifications.filter(
    (notification) => !readIds.has(notification.id)
  );
  const unreadCount = unreadNotifications.length;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen && user && notificationsEnabled && unreadNotifications.length) {
      markNotificationsRead(
        user.uid,
        unreadNotifications.map((notification) => notification.id)
      ).catch(() => {
        // Ignore read tracking failures for now.
      });
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative rounded-full"
          disabled={!notificationsEnabled}
        >
          <Bell className="h-5 w-5" />
          {notificationsEnabled && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Recent announcements from supervisors.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-72">
              <div className="flex flex-col gap-4 p-4 pt-0">
                {!notificationsEnabled ? (
                  <p className="text-sm text-muted-foreground">
                    Notifications are off. Enable them in Settings.
                  </p>
                ) : loading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : notifications.length ? (
                  notifications.map((notification, index) => (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-4 ${
                        readIds.has(notification.id) ? "" : "font-semibold"
                      }`}
                    >
                      <div
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                          readIds.has(notification.id)
                            ? "bg-transparent"
                            : "bg-primary"
                        }`}
                      />
                    <div className="grid gap-1">
                      <p className="text-sm leading-none">{notification.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No notifications yet.
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
