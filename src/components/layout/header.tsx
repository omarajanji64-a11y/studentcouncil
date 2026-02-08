"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Home,
  LogOut,
  PanelLeft,
  Settings,
  Ticket,
  Users,
  CalendarClock,
  ScrollText,
  Send,
  MessageSquare,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { usePathname, useRouter } from "next/navigation";
import { CreatePassButton } from "../passes/create-pass-button";
import { NotificationBell } from "../notifications/notification-bell";
import { isAdmin, isStaff } from "@/lib/permissions";
import { OverridePassButton } from "../passes/override-pass-button";

const navLinks = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/passes", icon: Ticket, label: "Active Passes" },
  { href: "/complaints", icon: MessageSquare, label: "Complaints" },
  { href: "/logs", icon: ScrollText, label: "Logs" },
  { href: "/analytics", icon: BarChart3, label: "Analytics", role: "admin" },
  {
    href: "/schedule",
    icon: CalendarClock,
    label: "Schedule",
  },
  { href: "/members", icon: Users, label: "Manage Members", role: "staff" },
  {
    href: "/notifications",
    icon: Send,
    label: "Send Notification",
    role: "staff",
  },
];

export function AppHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const pageTitle =
    navLinks.find((link) => pathname.startsWith(link.href))?.label ||
    "Canteen Control";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="/dashboard"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
            >
              <Ticket className="h-5 w-5 transition-all group-hover:scale-110" />
              <span className="sr-only">Canteen Control</span>
            </Link>
            {navLinks.map(
              (link) =>
                (!link.role ||
                  (link.role === "staff" && isStaff(user)) ||
                  (link.role === "admin" && isAdmin(user))) && (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-4 px-2.5 ${
                      pathname.startsWith(link.href)
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                )
            )}
          </nav>
        </SheetContent>
      </Sheet>
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">Canteen Control</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="relative ml-auto flex items-center gap-4">
        <CreatePassButton />
        <OverridePassButton />
        <NotificationBell />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="overflow-hidden rounded-full"
            >
              <Image
                src={user?.avatar || "/placeholder.svg"}
                width={36}
                height={36}
                alt="Avatar"
                className="overflow-hidden"
                data-ai-hint="person portrait"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <p className="font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
