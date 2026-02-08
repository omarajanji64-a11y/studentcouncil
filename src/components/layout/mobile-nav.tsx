"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Ticket,
  ScrollText,
  CalendarClock,
  Users,
  Send,
  MessageSquare,
  BarChart3,
} from "lucide-react";
import type { User } from "@/lib/types";
import { motion } from "framer-motion";
import { easing, durations } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { isAdmin, isStaff } from "@/lib/permissions";

const navLinks = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/passes", icon: Ticket, label: "Passes" },
  { href: "/complaints", icon: MessageSquare, label: "Complaints" },
  { href: "/logs", icon: ScrollText, label: "Logs" },
  { href: "/analytics", icon: BarChart3, label: "Analytics", role: "admin" },
  { href: "/schedule", icon: CalendarClock, label: "Schedule" },
  { href: "/members", icon: Users, label: "Members", role: "staff" },
  { href: "/notifications", icon: Send, label: "Notify", role: "staff" },
];

export function MobileNav({ user }: { user: User }) {
  const pathname = usePathname();
  const links = navLinks.filter(
    (link) =>
      !link.role ||
      (link.role === "staff" && isStaff(user)) ||
      (link.role === "admin" && isAdmin(user))
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/90 backdrop-blur-sm sm:hidden">
      <div className="relative flex items-center justify-between gap-1 px-2 py-2">
        {links.map((link) => {
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-[11px] font-medium transition-colors",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {isActive ? (
                <motion.span
                  layoutId="mobile-nav-indicator"
                  className="absolute inset-x-2 -top-1 h-1 rounded-full bg-primary/70"
                  transition={{ duration: durations.base, ease: easing }}
                />
              ) : null}
              <motion.div
                whileTap={{ scale: 0.94 }}
                transition={{ duration: durations.fast, ease: easing }}
              >
                <link.icon className="h-5 w-5" />
              </motion.div>
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
