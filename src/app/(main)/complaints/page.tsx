"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ComplaintForm } from "@/components/complaints/complaint-form";
import { ComplaintsTable } from "@/components/complaints/complaints-table";
import { useAuth } from "@/hooks/use-auth";
import { useDuties } from "@/hooks/use-firestore";
import { isStaff } from "@/lib/permissions";
import { useEffect, useMemo, useState } from "react";
import {
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { collections, converters } from "@/lib/firestore";
import type { Complaint } from "@/lib/types";

export default function ComplaintsPage() {
  const { user } = useAuth();
  const staffView = isStaff(user);
  const { data: duties } = useDuties({ enabled: !!user, realtime: false });
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pages, setPages] = useState<Record<number, Complaint[]>>({});
  const [pageInfo, setPageInfo] = useState<
    Record<
      number,
      { nextCursor: QueryDocumentSnapshot<DocumentData> | null; hasNext: boolean }
    >
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 10;
  useEffect(() => {
    const handle = window.setTimeout(() => {
      setSearch(searchInput);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  const normalizedSearch = search.trim().toLowerCase();
  const isLivePage = !normalizedSearch && pageIndex === 0;
  const queryKey = useMemo(
    () => `${staffView ? "staff" : user?.uid ?? "anon"}:${normalizedSearch}`,
    [normalizedSearch, staffView, user?.uid]
  );

  useEffect(() => {
    setPages({});
    setPageInfo({});
    setPageIndex(0);
  }, [queryKey]);

  const currentPage = pages[pageIndex];
  const currentInfo = pageInfo[pageIndex];

  useEffect(() => {
    if (!user) return;
    if (isLivePage) return;
    if (currentPage) return;
    const col = collections.complaints();
    if (!col) {
      setError("Firestore not configured.");
      return;
    }
    if (pageIndex > 0 && !pageInfo[pageIndex - 1]?.nextCursor) return;

    let active = true;
    setLoading(true);
    setError(null);

    const constraints: any[] = [];
    if (!staffView) {
      constraints.push(where("studentId", "==", user.uid));
    }
    if (normalizedSearch && staffView) {
      constraints.push(where("targetNameLower", ">=", normalizedSearch));
      constraints.push(where("targetNameLower", "<=", `${normalizedSearch}\uf8ff`));
      constraints.push(orderBy("targetNameLower"));
    } else {
      constraints.push(orderBy("timestamp", "desc"));
    }

    if (pageIndex > 0) {
      const cursor = pageInfo[pageIndex - 1]?.nextCursor;
      if (cursor) constraints.push(startAfter(cursor));
    }

    constraints.push(limit(pageSize + 1));

    const run = async () => {
      try {
        const snapshot = await getDocs(query(col, ...constraints));
        if (!active) return;
        const docs = snapshot.docs
          .map((doc) => converters.complaint.fromFirestore(doc))
          .filter((complaint) => staffView || complaint.studentId === user.uid);
        const hasNext = docs.length > pageSize;
        const pageDocs = hasNext ? docs.slice(0, pageSize) : docs;
        const nextCursor =
          hasNext && snapshot.docs.length >= pageSize
            ? snapshot.docs[pageSize - 1]
            : null;
        setPages((prev) => ({ ...prev, [pageIndex]: pageDocs }));
        setPageInfo((prev) => ({
          ...prev,
          [pageIndex]: { nextCursor, hasNext },
        }));
        setLoading(false);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load complaints.");
        setLoading(false);
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [user, staffView, normalizedSearch, pageIndex, currentPage, pageInfo]);

  useEffect(() => {
    if (!user) return;
    if (!isLivePage) return;
    const col = collections.complaints();
    if (!col) {
      setError("Firestore not configured.");
      return;
    }
    setLoading(true);
    setError(null);
    const liveConstraints: any[] = [];
    if (!staffView) {
      liveConstraints.push(where("studentId", "==", user.uid));
    }
    liveConstraints.push(orderBy("timestamp", "desc"));
    liveConstraints.push(limit(pageSize + 1));
    const unsubscribe = onSnapshot(
      query(col, ...liveConstraints),
      (snapshot) => {
        const docs = snapshot.docs
          .map((doc) => converters.complaint.fromFirestore(doc))
          .filter((complaint) => staffView || complaint.studentId === user.uid);
        const hasNext = docs.length > pageSize;
        const pageDocs = hasNext ? docs.slice(0, pageSize) : docs;
        const nextCursor = hasNext ? snapshot.docs[pageSize - 1] : null;
        setPages((prev) => ({ ...prev, 0: pageDocs }));
        setPageInfo((prev) => ({
          ...prev,
          0: { nextCursor, hasNext },
        }));
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Failed to load complaints.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user, staffView, isLivePage, pageSize]);

  if (!user) return null;
  const complaints = (currentPage ?? []).filter(
    (complaint) => staffView || complaint.studentId === user.uid
  );
  const hasNext = currentInfo?.hasNext ?? false;
  const isLoading = loading;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Complaints"
        description="Submit complaints and manage resolution status."
      />
      <ComplaintForm />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">
          Showing the latest {pageSize} complaints{normalizedSearch ? " (filtered)" : ""}.
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={pageIndex === 0 || isLoading}
            onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))}
          >
            Prev
          </Button>
          <div className="text-xs text-muted-foreground">Page {pageIndex + 1}</div>
          <Button
            size="sm"
            variant="outline"
            disabled={!hasNext || isLoading}
            onClick={() => setPageIndex((prev) => prev + 1)}
          >
            Next
          </Button>
        </div>
      </div>
      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      <Card>
        <CardContent className="pt-6">
          <ComplaintsTable
            data={complaints}
            duties={duties}
            loading={isLoading}
            staffView={staffView}
            onRefresh={() => {
              setPages({});
              setPageInfo({});
              setPageIndex(0);
            }}
            searchValue={searchInput}
            onSearchChange={(value) => setSearchInput(value)}
            serverSide={staffView}
          />
        </CardContent>
      </Card>
    </div>
  );
}
