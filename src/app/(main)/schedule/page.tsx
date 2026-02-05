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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Break } from "@/lib/types";
import { format } from "date-fns";

const mockBreaks: Break[] = [
  { id: 'break-1', name: "Morning Break", startTime: new Date().setHours(10, 30, 0, 0), endTime: new Date().setHours(10, 45, 0, 0) },
  { id: 'break-2', name: "Lunch", startTime: new Date().setHours(12, 30, 0, 0), endTime: new Date().setHours(13, 15, 0, 0) },
  { id: 'break-3', name: "Afternoon Break", startTime: new Date().setHours(14, 45, 0, 0), endTime: new Date().setHours(15, 0, 0, 0) },
];

export default function SchedulePage() {
  const isBreakActive = (b: Break) => {
    const now = Date.now();
    return now >= b.startTime && now < b.endTime;
  }

  return (
    <div>
      <PageHeader
        title="Break Scheduler"
        description="Manage daily break times for pass issuing."
      >
        <Button size="sm" className="gap-1">
          <PlusCircle className="h-4 w-4" />
          New Break
        </Button>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Breaks</CardTitle>
          <CardDescription>
            Passes can only be issued during these scheduled times.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockBreaks.map((breakItem) => (
                <TableRow key={breakItem.id}>
                  <TableCell className="font-medium">{breakItem.name}</TableCell>
                  <TableCell>{format(new Date(breakItem.startTime), 'p')}</TableCell>
                  <TableCell>{format(new Date(breakItem.endTime), 'p')}</TableCell>
                  <TableCell>
                    {isBreakActive(breakItem) ? (
                      <Badge className="bg-green-500">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button aria-haspopup="true" size="icon" variant="ghost">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
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
