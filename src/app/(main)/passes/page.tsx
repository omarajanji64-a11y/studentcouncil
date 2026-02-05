"use client";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { File, ListFilter, MoreHorizontal } from "lucide-react";
import type { Pass } from "@/lib/types";
import { format, formatDistanceToNowStrict } from "date-fns";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

const mockPasses: Pass[] = [
  { id: 'pass-1', studentName: 'James Holden', reason: 'Forgot lunch', issuedBy: 'Alex Chen', issuedAt: Date.now() - 5 * 60 * 1000, expiresAt: Date.now() + 15 * 60 * 1000, status: 'active' },
  { id: 'pass-2', studentName: 'Naomi Nagata', reason: 'Meeting with teacher', issuedBy: 'Alex Chen', issuedAt: Date.now() - 2 * 60 * 1000, expiresAt: Date.now() + 18 * 60 * 1000, status: 'active' },
  { id: 'pass-3', studentName: 'Amos Burton', reason: 'Library book return', issuedBy: 'Dr. Evelyn Reed', issuedAt: Date.now() - 10 * 60 * 1000, expiresAt: Date.now() + 10 * 60 * 1000, status: 'active' },
  { id: 'pass-4', studentName: 'Alex Kamal', reason: 'Medical appointment', issuedBy: 'Alex Chen', issuedAt: Date.now() - 1 * 60 * 1000, expiresAt: Date.now() + 2 * 60 * 1000, status: 'active' },
  { id: 'pass-5', studentName: 'Chrisjen Avasarala', reason: 'Tutoring session', issuedBy: 'Dr. Evelyn Reed', issuedAt: Date.now() - 12 * 60 * 1000, expiresAt: Date.now() + 8 * 60 * 1000, status: 'active' },
];

const TimeCell = ({ timestamp, isExpiry = false }: { timestamp: number, isExpiry?: boolean }) => {
    const [timeValue, setTimeValue] = useState("");

    useEffect(() => {
        const updateTimer = () => {
            if (isExpiry) {
                const now = Date.now();
                if (now > timestamp) {
                    setTimeValue("Expired");
                } else {
                    setTimeValue(formatDistanceToNowStrict(new Date(timestamp)) + ' left');
                }
            } else {
                setTimeValue(format(new Date(timestamp), 'HH:mm:ss'));
            }
        };

        updateTimer();
        const intervalId = setInterval(updateTimer, 1000);

        return () => clearInterval(intervalId);
    }, [timestamp, isExpiry]);
    
    const isNearExpiry = isExpiry && (timestamp - Date.now() < 5 * 60 * 1000);
    const isExpired = isExpiry && Date.now() > timestamp;

    let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "default";
    if (isExpired) badgeVariant = "destructive";
    else if (isNearExpiry) badgeVariant = "outline";

    if (isExpiry) {
      return <Badge variant={badgeVariant}>{timeValue}</Badge>
    }

    return <span>{timeValue}</span>;
}


export default function ActivePassesPage() {
  return (
    <div>
      <PageHeader
        title="Active Passes"
        description="A live view of all currently active canteen passes."
      >
        <div className="flex items-center gap-2">
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
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead className="hidden lg:table-cell">Reason</TableHead>
                <TableHead className="hidden md:table-cell">Issued By</TableHead>
                <TableHead className="hidden sm:table-cell">Issued At</TableHead>
                <TableHead className="text-right">Expires</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPasses.map((pass) => (
                <TableRow key={pass.id}>
                  <TableCell className="font-medium">{pass.studentName}</TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">{pass.reason}</TableCell>
                  <TableCell className="hidden md:table-cell">{pass.issuedBy}</TableCell>
                  <TableCell className="hidden sm:table-cell"><TimeCell timestamp={pass.issuedAt} /></TableCell>
                  <TableCell className="text-right"><TimeCell timestamp={pass.expiresAt} isExpiry={true} /></TableCell>
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
                        <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">Revoke Pass</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
