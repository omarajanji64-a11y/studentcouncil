"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuth, useRequireAuth } from "@/hooks/use-auth";
import { AnimatePresence, motion } from "framer-motion";
import { Skeleton } from "../ui/skeleton";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useRequireAuth();
  const router = useRouter();

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
        <div className="flex flex-1 flex-col">
          <AppHeader />
          <AnimatePresence mode="wait" initial={false}>
            <motion.main
              key={router.asPath}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 p-4 md:p-6 lg:p-8"
            >
              {children}
            </motion.main>
          </AnimatePresence>
        </div>
      </div>
    </SidebarProvider>
  );
}
