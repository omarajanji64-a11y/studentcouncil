"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { AuthProvider } from "@/hooks/use-auth";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>{children}</AuthProvider>
    </MotionConfig>
  );
}
