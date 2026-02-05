"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { cardItem } from "@/lib/animations";

export function AnimatedCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={cardItem}
      whileTap={{ scale: 0.99 }}
      className={cn("will-change-transform", className)}
    >
      {children}
    </motion.div>
  );
}
