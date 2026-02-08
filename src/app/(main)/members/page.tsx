"use client";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useRequireAuth } from "@/hooks/use-auth";
import {
  createUser,
  removeUser,
  updateUserScheduleEditor,
  updateUserRole,
  useUsers,
} from "@/hooks/use-firestore";
import { useToast } from "@/hooks/use-toast";
import { MotionModal } from "@/components/motion/motion-modal";
import { useState } from "react";

export default function MembersPage() {
  const { user: currentUser } = useRequireAuth("supervisor");
  const { data: users, loading } = useUsers();
  const sortedUsers = [...users].sort((a, b) =>
    (a.name || "").localeCompare(b.name || "")
  );
  const { toast } = useToast();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "supervisor" | "admin">(
    "member"
  );

  const handleRoleChange = (uid: string, newRole: "member" | "supervisor" | "admin") => {
    updateUserRole(uid, newRole, currentUser?.uid).catch(() =>
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "Could not update the user's role.",
      })
    );
  };

  const handleRemoveUser = (uid: string) => {
    removeUser(uid, currentUser?.uid).catch(() =>
      toast({
        variant: "destructive",
        title: "Remove failed",
        description: "Could not remove the user.",
      })
    );
  };

  const handleScheduleEditorToggle = (uid: string, enabled: boolean) => {
    updateUserScheduleEditor(uid, enabled, currentUser?.uid).catch(() =>
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "Could not update schedule editor access.",
      })
    );
  };

  const handleCreateUser = async () => {
    if (!inviteName.trim() || !inviteEmail.trim() || !invitePassword.trim()) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Name, email, and a temporary password are required.",
      });
      return;
    }
    if (invitePassword.trim().length < 6) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "Password must be at least 6 characters.",
      });
      return;
    }

    setIsCreating(true);
    try {
      await createUser({
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        password: invitePassword.trim(),
        role: inviteRole,
        actorId: currentUser.uid,
      });
      setIsCreating(false);
      setIsInviteOpen(false);
      setInviteName("");
      setInviteEmail("");
      setInvitePassword("");
      setInviteRole("member");
      toast({
        title: "Member added",
        description: "The member profile was created successfully.",
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Could not create the member profile and login.";
      setIsCreating(false);
      toast({
        variant: "destructive",
        title: "Create failed",
        description:
          message.includes("CORS") || message.includes("404")
            ? "User creation failed. Ensure the Cloud Function createAuthUser is deployed and the correct region is set."
            : message,
      });
    }
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
        <MotionModal
          open={isInviteOpen}
          onOpenChange={setIsInviteOpen}
          trigger={
            <Button size="sm" className="gap-1">
              <UserPlus className="h-4 w-4" />
              Add Member
            </Button>
          }
          title="Add Member"
          description="Create a member profile for staff access."
          contentClassName="sm:max-w-[480px]"
          footer={
            <Button onClick={handleCreateUser} disabled={isCreating}>
              {isCreating && <Skeleton className="mr-2 h-4 w-4 rounded-full" />}
              Add Member
            </Button>
          }
        >
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="invite-name" className="text-right">
                Name
              </Label>
              <Input
                id="invite-name"
                placeholder="Full name"
                className="col-span-3"
                value={inviteName}
                onChange={(event) => setInviteName(event.target.value)}
                disabled={isCreating}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="invite-email" className="text-right">
                Email
              </Label>
              <Input
                id="invite-email"
                placeholder="name@school.edu"
                className="col-span-3"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                disabled={isCreating}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="invite-password" className="text-right">
                Temp password
              </Label>
              <Input
                id="invite-password"
                type="password"
                placeholder="Minimum 6 characters"
                className="col-span-3"
                value={invitePassword}
                onChange={(event) => setInvitePassword(event.target.value)}
                disabled={isCreating}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="invite-role" className="text-right">
                Role
              </Label>
              <Select
                value={inviteRole}
                onValueChange={(value: "member" | "supervisor" | "admin") =>
                  setInviteRole(value)
                }
                disabled={isCreating}
              >
                <SelectTrigger id="invite-role" className="col-span-3">
                  <SelectValue placeholder="Choose role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  {currentUser.role === "admin" ? (
                    <SelectItem value="admin">Admin</SelectItem>
                  ) : null}
                </SelectContent>
              </Select>
            </div>
          </div>
        </MotionModal>
      </PageHeader>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Schedule Editor</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
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
              ) : sortedUsers.length ? (
                sortedUsers.map((user) => (
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
                      variant={user.role === "admin" || user.role === "supervisor" ? "default" : "secondary"}
                      className="capitalize"
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={user.canEditSchedule ?? false}
                      onCheckedChange={(value) => handleScheduleEditorToggle(user.uid, value)}
                      disabled={user.uid === currentUser?.uid}
                    />
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
                        {currentUser?.role === "admin" ? (
                          <>
                            <DropdownMenuItem onClick={() => handleRoleChange(user.uid, "member")}>
                              Set Member
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleChange(user.uid, "supervisor")}>
                              Set Supervisor
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleChange(user.uid, "admin")}>
                              Set Admin
                            </DropdownMenuItem>
                          </>
                        ) : user.role === "member" ? (
                          <DropdownMenuItem onClick={() => handleRoleChange(user.uid, "supervisor")}>
                            Make Supervisor
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleRoleChange(user.uid, "member")}>
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
                  <TableCell colSpan={5} className="h-24 text-center">
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
