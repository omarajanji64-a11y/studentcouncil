"use client";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import type { Pass } from "@/lib/types";
import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";

const mockPasses: Pass[] = [
    {
        id: 'pass-1',
        studentName: 'James Holden',
        reason: 'Forgot lunch',
        issuedBy: 'Alex Chen',
        issuedAt: Date.now() - 5 * 60 * 1000,
        expiresAt: Date.now() + 15 * 60 * 1000,
        status: 'active'
    },
    {
        id: 'pass-2',
        studentName: 'Naomi Nagata',
        reason: 'Meeting with teacher',
        issuedBy: 'Alex Chen',
        issuedAt: Date.now() - 2 * 60 * 1000,
        expiresAt: Date.now() + 18 * 60 * 1000,
        status: 'active'
    },
    {
        id: 'pass-3',
        studentName: 'Amos Burton',
        reason: 'Library book return',
        issuedBy: 'Dr. Evelyn Reed',
        issuedAt: Date.now() - 10 * 60 * 1000,
        expiresAt: Date.now() + 10 * 60 * 1000,
        status: 'active'
    },
];

const TimeLeft = ({ expiresAt }: { expiresAt: number }) => {
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        const updateTimer = () => {
            const distance = formatDistanceToNow(new Date(expiresAt), { addSuffix: true });
            setTimeLeft(distance);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000 * 60); // Update every minute

        return () => clearInterval(interval);
    }, [expiresAt]);

    const isNearExpiry = expiresAt - Date.now() < 5 * 60 * 1000;
    const isExpired = Date.now() > expiresAt;
    
    let colorClass = "text-green-600";
    if (isExpired) {
        colorClass = "text-red-600";
    } else if (isNearExpiry) {
        colorClass = "text-amber-600";
    }

    return <span className={colorClass}>{isExpired ? "Expired" : timeLeft}</span>;
}

export function ActivePassesCard() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Active Canteen Passes</CardTitle>
                <CardDescription>
                    A real-time list of students currently with an active pass.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead className="hidden sm:table-cell">Reason</TableHead>
                            <TableHead className="hidden md:table-cell">Issued By</TableHead>
                            <TableHead className="text-right">Time Left</TableHead>
                            <TableHead>
                                <span className="sr-only">Actions</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {mockPasses.map((pass) => (
                            <TableRow key={pass.id}>
                                <TableCell className="font-medium">{pass.studentName}</TableCell>
                                <TableCell className="hidden sm:table-cell">{pass.reason}</TableCell>
                                <TableCell className="hidden md:table-cell">{pass.issuedBy}</TableCell>
                                <TableCell className="text-right font-medium">
                                    <TimeLeft expiresAt={pass.expiresAt} />
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
    );
}
