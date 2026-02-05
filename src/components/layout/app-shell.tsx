"use client";

import type { ReactNode } from "react";
import { AppSidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useRequireAuth } from "@/hooks/use-auth";
import { Skeleton } from "../ui/skeleton";
import { PageWrapper } from "@/components/motion/page-wrapper";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useRequireAuth();

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar user={user} />
        <div className="flex flex-1 flex-col sm:pl-14">
          <AppHeader />
          <main className="flex-1 p-4 pb-24 md:p-6 lg:p-8">
            <PageWrapper>{children}</PageWrapper>
          </main>
        </div>
      </div>
      <MobileNav user={user} />
    </SidebarProvider>
  );
}
