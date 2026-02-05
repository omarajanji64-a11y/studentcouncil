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
import { useNotifications } from "@/hooks/use-firestore";

export function NotificationBell() {
  const { data: notifications, loading } = useNotifications();
  const unreadCount = notifications.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
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
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : notifications.length ? (
                  notifications.map((notification, index) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 ${
                      index === 0 ? "font-semibold" : ""
                    }`}
                  >
                    <div
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        index === 0 ? "bg-primary" : "bg-transparent"
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
