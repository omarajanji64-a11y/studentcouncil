import type { User } from "@/lib/types";

export const isSupervisor = (user?: User | null) =>
  user?.role === "supervisor" || user?.role === "admin";

export const isAdmin = (user?: User | null) => user?.role === "admin";

export const isStaff = (user?: User | null) =>
  user?.role === "supervisor" || user?.role === "admin";
