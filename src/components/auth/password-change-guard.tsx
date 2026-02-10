"use client";

import { useState } from "react";
import { updatePassword } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { clearTemporaryPasswordFlag } from "@/hooks/use-firestore";

export function PasswordChangeGuard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!user?.mustChangePassword) return null;

  const handleUpdate = async () => {
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

    setIsSaving(true);
    try {
      await updatePassword(auth.currentUser, password);
      await clearTemporaryPasswordFlag(user.uid, user.uid);
      setPassword("");
      setConfirm("");
      toast({
        title: "Password updated",
        description: "You're all set. Continue to the app.",
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Unable to update your password.";
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
          <h2 className="text-lg font-semibold">Change your password</h2>
          <p className="text-sm text-muted-foreground">
            This account uses a temporary password. Please set a new password to continue.
          </p>
        </div>
        <div className="space-y-3">
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
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={logout}
            disabled={isSaving}
          >
            Sign out
          </Button>
          <Button onClick={handleUpdate} disabled={isSaving}>
            {isSaving ? <Skeleton className="mr-2 h-4 w-4 rounded-full" /> : null}
            Update password
          </Button>
        </div>
      </Card>
    </div>
  );
}
