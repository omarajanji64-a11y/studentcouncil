"use client"

import { motion } from "framer-motion"
import { shimmerMotion } from "@/lib/animations"
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted/60",
        className
      )}
      {...props}
    >
      <motion.div
        aria-hidden
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
        variants={shimmerMotion}
        initial="initial"
        animate="animate"
      />
    </div>
  )
}

export { Skeleton }
