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
import { Badge } from "../ui/badge";
import { format } from "date-fns";

export function LogsTable({ data }: { data: Log[] }) {
  const [filter, setFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string[]>([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const rowsPerPage = 10;

  const filteredData = React.useMemo(() => {
    let filtered = data;
    if (filter) {
      filtered = filtered.filter((log) =>
        log.studentName.toLowerCase().includes(filter.toLowerCase())
      );
    }
    if (statusFilter.length > 0) {
        filtered = filtered.filter((log) => statusFilter.includes(log.status));
    }
    return filtered;
  }, [data, filter, statusFilter]);

  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const getStatusBadge = (status: Log["status"]) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Active</Badge>;
      case "expired":
        return <Badge variant="secondary">Expired</Badge>;
      case "revoked":
        return <Badge variant="destructive">Revoked</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Filter by student name..."
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Status <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {['active', 'expired', 'revoked'].map((status) => (
                  <DropdownMenuCheckboxItem
                    key={status}
                    className="capitalize"
                    checked={statusFilter.includes(status)}
                    onCheckedChange={(value) => {
                        setStatusFilter(current => 
                            value ? [...current, status] : current.filter(s => s !== status)
                        )
                    }}
                  >
                    {status}
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
              <TableHead>Student</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Issued At</TableHead>
              <TableHead>Issued By</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length ? (
              paginatedData.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.studentName}</TableCell>
                  <TableCell>{log.reason}</TableCell>
                  <TableCell>{format(new Date(log.issuedAt), 'PPp')}</TableCell>
                  <TableCell>{log.issuedBy}</TableCell>
                  <TableCell>{getStatusBadge(log.status)}</TableCell>
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
