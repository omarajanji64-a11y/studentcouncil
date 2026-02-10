"use client";

import { useMemo, useState } from "react";
import { updatePassword, updateProfile } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { updateUserProfileBasics } from "@/hooks/use-firestore";

export function ProfileSetupGuard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name ?? "");
  const [gender, setGender] = useState<"male" | "female" | "">(
    user?.gender ?? ""
  );
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const needsPasswordChange = !!user?.mustChangePassword;
  const needsProfile = useMemo(() => {
    if (!user) return false;
    const trimmed = (user.name || "").trim();
    if (!trimmed) return true;
    if (trimmed.toLowerCase() === "unknown") return true;
    if (trimmed.toLowerCase() === "staff member") return true;
    if (!user.gender) return true;
    return false;
  }, [user]);

  if (!user || (!needsPasswordChange && !needsProfile)) return null;

  const handleUpdate = async () => {
    if (!user) return;
    if (!name.trim()) {
      toast({
        variant: "destructive",
        title: "Name required",
        description: "Please enter your full name.",
      });
      return;
    }
    if (!gender) {
      toast({
        variant: "destructive",
        title: "Select Boy or Girl",
        description: "Please choose one option to continue.",
      });
      return;
    }

    if (needsPasswordChange) {
      if (!auth?.currentUser) {
        toast({
          variant: "destructive",
          title: "Not signed in",
          description: "Please sign in again to update your password.",
        });
        return;
      }
      if (password.length < 6) {
        toast({
          variant: "destructive",
          title: "Password too short",
          description: "Password must be at least 6 characters.",
        });
        return;
      }
      if (password !== confirm) {
        toast({
          variant: "destructive",
          title: "Passwords do not match",
          description: "Please confirm the same password.",
        });
        return;
      }
    }

    setIsSaving(true);
    try {
      if (needsPasswordChange && auth?.currentUser) {
        await updatePassword(auth.currentUser, password);
      }
      if (auth?.currentUser && name.trim() !== (auth.currentUser.displayName || "")) {
        await updateProfile(auth.currentUser, { displayName: name.trim() });
      }
      await updateUserProfileBasics(user.uid, {
        name: name.trim(),
        gender: gender as "male" | "female",
        mustChangePassword: false,
      });
      setPassword("");
      setConfirm("");
      toast({
        title: "Profile updated",
        description: "Thanks! You can now continue.",
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Unable to update your profile.";
      toast({
        variant: "destructive",
        title: "Update failed",
        description: message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <Card className="w-full max-w-md p-6 space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Complete your profile</h2>
          <p className="text-sm text-muted-foreground">
            Please set your name and select Boy or Girl before continuing.
          </p>
        </div>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="setup-name">Full name</Label>
            <Input
              id="setup-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter your full name"
              disabled={isSaving}
            />
          </div>
          <div className="space-y-2">
            <Label>Boy / Girl</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={gender === "male" ? "default" : "outline"}
                onClick={() => setGender("male")}
                disabled={isSaving}
              >
                Boy
              </Button>
              <Button
                type="button"
                variant={gender === "female" ? "default" : "outline"}
                onClick={() => setGender("female")}
                disabled={isSaving}
              >
                Girl
              </Button>
            </div>
          </div>
          {needsPasswordChange ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 6 characters"
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  placeholder="Re-enter password"
                  disabled={isSaving}
                />
              </div>
            </>
          ) : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={logout} disabled={isSaving}>
            Sign out
          </Button>
          <Button onClick={handleUpdate} disabled={isSaving}>
            {isSaving ? <Skeleton className="mr-2 h-4 w-4 rounded-full" /> : null}
            Save and continue
          </Button>
        </div>
      </Card>
    </div>
  );
}
