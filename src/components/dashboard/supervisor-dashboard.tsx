"use client";

import { useEffect, useMemo, useState } from "react";
import { onSnapshot, orderBy, query, where, limit } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { collections, converters } from "@/lib/firestore";
import type { Pass } from "@/lib/types";

export function SupervisorDashboard() {
  const [passes, setPasses] = useState<Pass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activePassesQuery = useMemo(() => {
    const col = collections.passes();
    if (!col) return null;
    // Filter to active/pending only so we never listen to the whole collection.
    // This dramatically reduces reads because Firestore only sends matching docs.
    return query(
      col,
      where("status", "in", ["active", "pending"]),
      // Keep the latest passes first and cap to 50 docs to control read volume.
      orderBy("issuedAt", "desc"),
      limit(50)
    );
  }, []);

  useEffect(() => {
    if (!activePassesQuery) {
      setLoading(false);
      setError("Firestore not configured.");
      return;
    }

    // Single onSnapshot listener with cleanup to avoid duplicate listeners/read spikes.
    const unsubscribe = onSnapshot(
      activePassesQuery,
      (snapshot) => {
        setPasses(snapshot.docs.map((doc) => converters.pass.fromFirestore(doc)));
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message || "Failed to load passes.");
        setLoading(false);
      }
    );

    // Cleanup ensures we stop listening when the component unmounts.
    return () => unsubscribe();
  }, [activePassesQuery]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active / Pending Passes</CardTitle>
        <CardDescription>
          Live supervisor view with a filtered 50-pass cap to stay within quota.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : error ? (
          <div className="text-sm text-destructive">{error}</div>
        ) : passes.length ? (
          <div className="space-y-2 text-sm">
            {passes.map((pass) => (
              <div key={pass.id} className="flex items-center justify-between gap-3">
                <div className="truncate font-medium">{pass.studentName}</div>
                <div className="text-muted-foreground capitalize">{pass.status}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No active passes.</div>
        )}
      </CardContent>
    </Card>
  );
}
