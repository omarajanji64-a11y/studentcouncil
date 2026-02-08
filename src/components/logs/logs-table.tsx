"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Log } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, File } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export function LogsTable({ data, loading }: { data: Log[]; loading?: boolean }) {
  const [filter, setFilter] = React.useState("");
  const [entityFilter, setEntityFilter] = React.useState<string[]>([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const rowsPerPage = 10;

  const filteredData = React.useMemo(() => {
    let filtered = data;
    if (filter) {
      filtered = filtered.filter((log) =>
        [log.action, log.entityType, log.entityId, log.userId]
          .join(" ")
          .toLowerCase()
          .includes(filter.toLowerCase())
      );
    }
    if (entityFilter.length > 0) {
        filtered = filtered.filter((log) => entityFilter.includes(log.entityType));
    }
    return filtered;
  }, [data, filter, entityFilter]);

  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Search action, user, or entity..."
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Entity <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {Array.from(new Set(data.map((log) => log.entityType))).map((entity) => (
                  <DropdownMenuCheckboxItem
                    key={entity}
                    className="capitalize"
                    checked={entityFilter.includes(entity)}
                    onCheckedChange={(value) => {
                        setEntityFilter(current => 
                            value ? [...current, entity] : current.filter(s => s !== entity)
                        )
                    }}
                  >
                    {entity}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" variant="outline" className="h-10 gap-1">
                <File className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Export
                </span>
            </Button>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-2/3 mx-auto" />
                    <Skeleton className="h-4 w-1/2 mx-auto" />
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedData.length ? (
              paginatedData.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">
                    {format(new Date(log.timestamp), "PPp")}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{log.userId}</TableCell>
                  <TableCell className="capitalize">{log.action.replace(/_/g, " ")}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {log.entityType} {log.entityId ? `• ${log.entityId}` : ""}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {log.details ? JSON.stringify(log.details) : "N/A"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
