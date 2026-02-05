"use client"

import { AnimatePresence, motion } from "framer-motion"
import { toastMotion } from "@/lib/animations"
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      <AnimatePresence mode="popLayout">
        {toasts.map(function ({ id, title, description, action, ...props }) {
          return (
            <Toast key={id} {...props} asChild>
              <motion.div
                variants={toastMotion}
                initial="initial"
                animate="animate"
                exit="exit"
                layout
              >
                <div className="grid gap-1">
                  {title && <ToastTitle>{title}</ToastTitle>}
                  {description && (
                    <ToastDescription>{description}</ToastDescription>
                  )}
                </div>
                {action}
                <ToastClose />
              </motion.div>
            </Toast>
          )
        })}
      </AnimatePresence>
      <ToastViewport />
    </ToastProvider>
  )
}
