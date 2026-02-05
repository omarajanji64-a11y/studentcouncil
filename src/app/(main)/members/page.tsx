"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { User } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";

const initialUsers: User[] = [
  {
    uid: "sup-123",
    name: "Dr. Evelyn Reed",
    email: "e.reed@school.edu",
    role: "supervisor",
    avatar: "https://picsum.photos/seed/101/40/40",
  },
  {
    uid: "mem-456",
    name: "Alex Chen",
    email: "a.chen@school.edu",
    role: "member",
    avatar: "https://picsum.photos/seed/102/40/40",
  },
  {
    uid: "mem-789",
    name: "Maria Garcia",
    email: "m.garcia@school.edu",
    role: "member",
    avatar: "https://picsum.photos/seed/103/40/40",
  },
  {
    uid: "mem-101",
    name: "Ben Carter",
    email: "b.carter@school.edu",
    role: "member",
    avatar: "https://picsum.photos/seed/104/40/40",
  },
  {
    uid: "test-user-1",
    name: "Ihsan Test",
    email: "test@ihsan.com",
    role: "supervisor",
    avatar: "https://picsum.photos/seed/105/40/40",
  },
];

export default function MembersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>(initialUsers);

  const handleRoleChange = (uid: string, newRole: "member" | "supervisor") => {
    setUsers(users.map((u) => (u.uid === uid ? { ...u, role: newRole } : u)));
  };

  const handleRemoveUser = (uid: string) => {
    setUsers(users.filter((u) => u.uid !== uid));
  };

  return (
    <div>
      <PageHeader
        title="Manage Members"
        description="Add, remove, and manage roles for staff members."
      >
        <Button size="sm" className="gap-1">
          <UserPlus className="h-4 w-4" />
          Invite Member
        </Button>
      </PageHeader>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.uid}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="hidden h-9 w-9 sm:flex">
                        <AvatarImage
                          src={user.avatar}
                          alt="Avatar"
                          data-ai-hint="person portrait"
                        />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="font-medium">{user.name}</div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === "supervisor" ? "default" : "secondary"}
                      className="capitalize"
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-haspopup="true"
                          size="icon"
                          variant="ghost"
                          disabled={user.uid === currentUser?.uid}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {user.role === "member" ? (
                          <DropdownMenuItem
                            onClick={() =>
                              handleRoleChange(user.uid, "supervisor")
                            }
                          >
                            Make Supervisor
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleRoleChange(user.uid, "member")}
                          >
                            Make Member
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                          onClick={() => handleRemoveUser(user.uid)}
                        >
                          Remove User
                        </DropdownMenuItem>
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
