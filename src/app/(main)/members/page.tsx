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
  updateUserGender,
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
  const [inviteGender, setInviteGender] = useState<"male" | "female" | "">("");
  const [genderOverrides, setGenderOverrides] = useState<
    Record<string, "male" | "female" | undefined>
  >({});

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

  const handleGenderChange = (uid: string, gender: "male" | "female") => {
    setGenderOverrides((prev) => ({ ...prev, [uid]: gender }));
    updateUserGender(uid, gender, currentUser?.uid)
      .catch((error) => {
        setGenderOverrides((prev) => {
          const next = { ...prev };
          delete next[uid];
          return next;
        });
        toast({
          variant: "destructive",
          title: "Update failed",
          description:
            error instanceof Error && error.message
              ? error.message
              : "Could not update sex.",
        });
      });
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
        gender: inviteGender || undefined,
        actorId: currentUser.uid,
      });
      setIsCreating(false);
      setIsInviteOpen(false);
      setInviteName("");
      setInviteEmail("");
      setInvitePassword("");
      setInviteRole("member");
      setInviteGender("");
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
        description: message,
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
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
              <Label htmlFor="invite-name" className="sm:text-right">
                Name
              </Label>
              <Input
                id="invite-name"
                placeholder="Full name"
                className="sm:col-span-3"
                value={inviteName}
                onChange={(event) => setInviteName(event.target.value)}
                disabled={isCreating}
              />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
              <Label htmlFor="invite-email" className="sm:text-right">
                Email
              </Label>
              <Input
                id="invite-email"
                placeholder="name@school.edu"
                className="sm:col-span-3"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                disabled={isCreating}
              />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
              <Label htmlFor="invite-password" className="sm:text-right">
                Temp password
              </Label>
              <Input
                id="invite-password"
                type="password"
                placeholder="Minimum 6 characters"
                className="sm:col-span-3"
                value={invitePassword}
                onChange={(event) => setInvitePassword(event.target.value)}
                disabled={isCreating}
              />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
              <Label htmlFor="invite-role" className="sm:text-right">
                Role
              </Label>
              <Select
                value={inviteRole}
                onValueChange={(value: "member" | "supervisor" | "admin") =>
                  setInviteRole(value)
                }
                disabled={isCreating}
              >
                <SelectTrigger id="invite-role" className="sm:col-span-3">
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
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
              <Label htmlFor="invite-gender" className="sm:text-right">
                Sex
              </Label>
              <Select
                value={inviteGender}
                onValueChange={(value: "male" | "female" | "") =>
                  setInviteGender(value)
                }
                disabled={isCreating}
              >
                <SelectTrigger id="invite-gender" className="sm:col-span-3">
                  <SelectValue placeholder="Select sex" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </MotionModal>
      </PageHeader>
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-3 md:hidden">
            {loading ? (
              <Card>
                <CardContent className="pt-6 text-center text-sm text-muted-foreground">
                  Loading members...
                </CardContent>
              </Card>
            ) : sortedUsers.length ? (
              sortedUsers.map((user) => (
                <Card key={user.uid}>
                  <CardContent className="pt-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={user.avatar}
                            alt="Avatar"
                            data-ai-hint="person portrait"
                          />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
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
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <Badge
                        variant={user.role === "admin" || user.role === "supervisor" ? "default" : "secondary"}
                        className="capitalize"
                      >
                        {user.role}
                      </Badge>
                      <Select
                        value={genderOverrides[user.uid] ?? user.gender ?? ""}
                        onValueChange={(value: "male" | "female" | "") =>
                          value ? handleGenderChange(user.uid, value) : null
                        }
                      >
                        <SelectTrigger className="h-8 w-[120px]">
                          <SelectValue placeholder="Sex" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Schedule Editor</span>
                        <Switch
                          checked={user.canEditSchedule ?? false}
                          onCheckedChange={(value) => handleScheduleEditorToggle(user.uid, value)}
                          disabled={user.uid === currentUser?.uid}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-sm text-muted-foreground">
                  No members found.
                </CardContent>
              </Card>
            )}
          </div>

          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Sex</TableHead>
                  <TableHead>Schedule Editor</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
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
                      <Select
                        value={genderOverrides[user.uid] ?? user.gender ?? ""}
                        onValueChange={(value: "male" | "female" | "") =>
                          value ? handleGenderChange(user.uid, value) : null
                        }
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Select sex" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
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
                    <TableCell colSpan={6} className="h-24 text-center">
                      No members found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
