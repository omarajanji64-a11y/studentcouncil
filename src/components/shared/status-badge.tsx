"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { easing, durations } from "@/lib/animations";
import type { Log, Pass } from "@/lib/types";

type Status = Log["status"] | Pass["status"];

const statusStyles: Record<
  Status,
  { label: string; bg: string; text: string }
> = {
  active: {
    label: "Active",
    bg: "rgba(34, 197, 94, 0.15)",
    text: "rgb(21, 128, 61)",
  },
  expired: {
    label: "Expired",
    bg: "rgba(148, 163, 184, 0.18)",
    text: "rgb(100, 116, 139)",
  },
  revoked: {
    label: "Revoked",
    bg: "rgba(239, 68, 68, 0.15)",
    text: "rgb(185, 28, 28)",
  },
};

export function StatusBadge({ status }: { status: Status }) {
  const style = statusStyles[status] ?? statusStyles.expired;
  const isActive = status === "active";

  return (
    <motion.div
      initial={false}
      animate={{
        backgroundColor: style.bg,
        color: style.text,
        scale: isActive ? [1, 1.04, 1] : 1,
      }}
      transition={{
        duration: durations.base,
        ease: easing,
      }}
      className="inline-flex rounded-full"
    >
      <Badge
        variant="outline"
        className="border-transparent bg-transparent px-2.5 py-0.5 text-xs font-semibold"
      >
        {style.label}
      </Badge>
    </motion.div>
  );
}
