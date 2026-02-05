"use client";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRequireAuth } from "@/hooks/use-auth";
import { removeUser, updateUserRole, useUsers } from "@/hooks/use-firestore";
import { useToast } from "@/hooks/use-toast";

export default function MembersPage() {
  const { user: currentUser } = useRequireAuth("supervisor");
  const { data: users, loading } = useUsers();
  const { toast } = useToast();

  const handleRoleChange = (uid: string, newRole: "member" | "supervisor") => {
    updateUserRole(uid, newRole).catch(() =>
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "Could not update the user's role.",
      })
    );
  };

  const handleRemoveUser = (uid: string) => {
    removeUser(uid).catch(() =>
      toast({
        variant: "destructive",
        title: "Remove failed",
        description: "Could not remove the user.",
      })
    );
  };

  if (!currentUser) {
    return null;
  }

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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Loading members...
                  </TableCell>
                </TableRow>
              ) : users.length ? (
                users.map((user) => (
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
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No members found.
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
