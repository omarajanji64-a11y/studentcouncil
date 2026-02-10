"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  Home,
  LogOut,
  Settings,
  Ticket,
  Users,
  CalendarClock,
  ScrollText,
  Send,
  MessageSquare,
  BarChart3,
} from "lucide-react";
import type { User } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { easing, durations } from "@/lib/animations";
import { isAdmin, isStaff } from "@/lib/permissions";

interface AppSidebarProps {
  user: User;
}

const navLinks = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/passes", icon: Ticket, label: "Active Passes" },
  { href: "/complaints", icon: MessageSquare, label: "Complaints" },
  { href: "/logs", icon: ScrollText, label: "Logs" },
  { href: "/analytics", icon: BarChart3, label: "Analytics", role: "admin" },
];

const supervisorLinks = [
  { href: "/members", icon: Users, label: "Manage Members" },
  { href: "/notifications", icon: Send, label: "Send Notification" },
];

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const renderLink = (link: typeof navLinks[0], isMobile?: boolean) => {
    const isActive = pathname.startsWith(link.href);
    if (link.role === "staff" && !isStaff(user)) {
      return null;
    }
    if (link.role === "admin" && !isAdmin(user)) {
      return null;
    }
    const content = (
      <>
        <link.icon className="h-5 w-5" />
        <span className="sr-only">{link.label}</span>
      </>
    );
    if (isMobile) {
      return (
        <Link
          href={link.href}
          className={`flex items-center gap-4 px-2.5 ${
            isActive
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {content}
          {link.label}
        </Link>
      );
    }
    return (
      <Tooltip key={link.href}>
        <TooltipTrigger asChild>
          <Link href={link.href}>
            <Button
              variant={isActive ? "secondary" : "ghost"}
              size="icon"
              className="rounded-lg"
              aria-label={link.label}
            >
              {content}
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={5}>
          {link.label}
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <motion.aside
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: durations.base, ease: easing }}
      className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex"
    >
      <TooltipProvider>
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
          <Link
            href="/dashboard"
            className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
          >
            <Ticket className="h-4 w-4 transition-all group-hover:scale-110" />
            <span className="sr-only">Student Council</span>
          </Link>
          {navLinks.map((link) => renderLink(link))}
          {renderLink({ href: "/schedule", icon: CalendarClock, label: "Schedule" })}
          {isStaff(user) && supervisorLinks.map((link) => renderLink(link))}
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/settings">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-lg"
                  aria-label="Settings"
                >
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Settings</span>
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={5}>
              Settings
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="mt-auto rounded-lg"
                aria-label="Logout"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Logout</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={5}>
              Logout
            </TooltipContent>
          </Tooltip>
        </nav>
      </TooltipProvider>
    </motion.aside>
  );
}
