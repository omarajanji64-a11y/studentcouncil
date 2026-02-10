"use client";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, File, ListFilter, MoreHorizontal } from "lucide-react";
import { useActivePasses, updatePassStatus } from "@/hooks/use-firestore";
import { format } from "date-fns";
import { easing, durations } from "@/lib/animations";
import { useEffect, useRef, useState } from "react";
import { useAuth, useRequireAuth } from "@/hooks/use-auth";
import { isStaff } from "@/lib/permissions";

export default function ActivePassesPage() {
  useRequireAuth();
  const { data: passes, loading } = useActivePasses();
  const activePasses = [...passes]
    .filter((pass) => pass.status === "active")
    .sort((a, b) => b.issuedAt - a.issuedAt);
  const [recentIds, setRecentIds] = useState<Set<string>>(new Set());
  const prevIdsRef = useRef<Set<string>>(new Set());
  const { user } = useAuth();
  const canManage = isStaff(user);

  useEffect(() => {
    const current = new Set(activePasses.map((pass) => pass.id));
    const prev = prevIdsRef.current;
    const newlyAdded = Array.from(current).filter((id) => !prev.has(id));

    if (newlyAdded.length) {
      setRecentIds((existing) => {
        const next = new Set(existing);
        newlyAdded.forEach((id) => next.add(id));
        return next;
      });
      newlyAdded.forEach((id) => {
        window.setTimeout(() => {
          setRecentIds((existing) => {
            const next = new Set(existing);
            next.delete(id);
            return next;
          });
        }, 1200);
      });
    }

    prevIdsRef.current = current;
  }, [activePasses]);

  return (
    <div>
      <PageHeader
        title="Active Passes"
        description="A live view of all currently active passes."
      >
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <ListFilter className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Filter
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Active</DropdownMenuItem>
              <DropdownMenuItem>Expiring Soon</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>All</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Export
            </span>
          </Button>
        </div>
      </PageHeader>
      <div className="grid gap-3 md:hidden">
        {loading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        ) : activePasses.length ? (
          activePasses.map((pass) => {
            const isRecent = recentIds.has(pass.id);
            return (
              <Card key={pass.id}>
                <CardContent className="pt-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-base font-semibold">
                        {pass.studentName}
                        {isRecent ? (
                          <span className="text-emerald-500">
                            <CheckCircle2 className="h-4 w-4" />
                          </span>
                        ) : null}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {pass.reason}
                      </div>
                    </div>
                    {canManage ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            onClick={() => updatePassStatus(pass.id, "revoked", user?.uid)}
                          >
                            Revoke Pass
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </div>
                  <div className="grid gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Issued</span>
                      <span>{format(new Date(pass.issuedAt), "p")}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Expires</span>
                      <span>{format(new Date(pass.expiresAt), "p")}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Issued By</span>
                      <span>{pass.issuedBy}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="pt-6 text-center text-sm text-muted-foreground">
              No active passes.
            </CardContent>
          </Card>
        )}
      </div>
      <Card className="hidden md:block">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead className="hidden lg:table-cell">Type</TableHead>
                <TableHead className="hidden lg:table-cell">Reason</TableHead>
                <TableHead className="hidden md:table-cell">Issued By</TableHead>
                <TableHead className="hidden sm:table-cell">Issued At</TableHead>
                <TableHead className="text-right">Expires At</TableHead>
                {canManage ? (
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={canManage ? 7 : 6}
                    className="h-24 text-center"
                  >
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-2/3 mx-auto" />
                      <Skeleton className="h-4 w-1/2 mx-auto" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : activePasses.length ? (
                <AnimatePresence mode="popLayout">
                  {activePasses.map((pass) => {
                    const isRecent = recentIds.has(pass.id);
                    return (
                      <motion.tr
                        key={pass.id}
                        layout
                        initial={{ opacity: 0, y: -10 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          backgroundColor: isRecent
                            ? "rgba(34, 197, 94, 0.08)"
                            : "rgba(0, 0, 0, 0)",
                          boxShadow: isRecent
                            ? "0 0 0 1px rgba(34,197,94,0.2), 0 8px 20px rgba(34,197,94,0.12)"
                            : "0 0 0 0 rgba(0,0,0,0)",
                          scale: isRecent ? 1.01 : 1,
                        }}
                        exit={{
                          opacity: 0,
                          x: -16,
                          backgroundColor: "rgba(239, 68, 68, 0.12)",
                        }}
                        transition={{ duration: durations.base, ease: easing }}
                        className="will-change-transform"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {pass.studentName}
                            <AnimatePresence>
                              {isRecent ? (
                                <motion.span
                                  initial={{ opacity: 0, scale: 0.7 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.7 }}
                                  transition={{
                                    duration: durations.fast,
                                    ease: easing,
                                  }}
                                  className="text-emerald-500"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </motion.span>
                              ) : null}
                            </AnimatePresence>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                          {pass.passType?.replace(/_/g, " ") ?? "active break"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                          {pass.reason}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {pass.issuedBy}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {format(new Date(pass.issuedAt), "p")}
                        </TableCell>
                        <TableCell className="text-right">
                          {format(new Date(pass.expiresAt), "p")}
                        </TableCell>
                        {canManage ? (
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Toggle menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                  onClick={() => updatePassStatus(pass.id, "revoked", user?.uid)}
                                >
                                  Revoke Pass
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        ) : null}
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={canManage ? 7 : 6}
                    className="h-24 text-center"
                  >
                    No active passes.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
