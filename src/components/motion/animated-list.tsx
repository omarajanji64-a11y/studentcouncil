"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cardStagger } from "@/lib/animations";
import { cn } from "@/lib/utils";

export function AnimatedList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={cardStagger}
      initial="hidden"
      animate="show"
      className={cn("will-change-transform", className)}
    >
      {children}
    </motion.div>
  );
}
