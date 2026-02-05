"use client";

import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { BreakStatusCard } from "@/components/dashboard/break-status-card";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { AnimatedCard } from "@/components/motion/animated-card";
import { AnimatedList } from "@/components/motion/animated-list";
import { useAuth } from "@/hooks/use-auth";
import { Ticket, ScrollText, CalendarClock, Users } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();

  const shortcuts = [
    {
      href: "/passes",
      icon: Ticket,
      title: "Active Passes",
      description: "View all currently active passes.",
    },
    {
      href: "/logs",
      icon: ScrollText,
      title: "Pass Logs",
      description: "Review the history of all issued passes.",
    },
    {
      href: "/schedule",
      icon: CalendarClock,
      title: "Break Scheduler",
      description: "Manage the daily break time schedule.",
      role: "supervisor",
    },
    {
      href: "/members",
      icon: Users,
      title: "Manage Members",
      description: "Add, remove, and manage staff members.",
      role: "supervisor",
    },
  ];

  return (
    <div className="container mx-auto px-0">
      <PageHeader
        title="Dashboard"
        description="Overview of canteen pass activity."
      />
      <div className="grid gap-6">
        <AnimatedList className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatedCard>
            <BreakStatusCard />
          </AnimatedCard>
        </AnimatedList>

        <div className="space-y-4 pt-6">
          <h2 className="text-xl font-semibold tracking-tight">
            Quick Shortcuts
          </h2>
          <AnimatedList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {shortcuts.map(
              (shortcut) =>
                (!shortcut.role || user?.role === "supervisor") && (
                  <Link
                    href={shortcut.href}
                    key={shortcut.href}
                    className="block hover:no-underline"
                  >
                    <AnimatedCard>
                      <Card className="h-full transition-colors hover:border-primary/50 hover:bg-muted/50">
                        <CardHeader>
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <shortcut.icon className="h-6 w-6" />
                            </div>
                            <CardTitle className="text-lg">
                              {shortcut.title}
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <CardDescription>
                            {shortcut.description}
                          </CardDescription>
                        </CardContent>
                      </Card>
                    </AnimatedCard>
                  </Link>
                )
            )}
          </AnimatedList>
        </div>
      </div>
    </div>
  );
}
