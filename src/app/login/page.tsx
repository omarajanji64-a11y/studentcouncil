"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Ticket } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { firebaseReady } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { PageWrapper } from "@/components/motion/page-wrapper";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<
    "member" | "supervisor" | "admin" | "signin" | null
  >(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const { signIn, signInDemo } = useAuth();

  const handleDemoLogin = async (role: "member" | "supervisor" | "admin") => {
    setIsLoading(role);
    try {
      await signInDemo(role);
      router.push("/dashboard");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Demo Login Failed",
        description: "Enable Firebase Auth (anonymous) and try again.",
      });
      setIsLoading(null);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading("signin");
    try {
      await signIn(email, password);
      router.push("/dashboard");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Check your credentials and Firebase Auth settings.",
      });
      setIsLoading(null);
    }
  };

  const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>Google</title>
      <path
        d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.6 1.62-4.88 1.62-4.42 0-8.03-3.6-8.03-8.02s3.6-8.02 8.03-8.02c2.45 0 4.02.98 4.9 1.88l2.84-2.78C19.34 2.46 16.3.98 12.48.98c-6.18 0-11.22 5.04-11.22 11.22s5.04 11.22 11.22 11.22c3.2 0 5.76-1.08 7.68-3.02 1.98-2.04 2.6-4.86 2.6-7.38 0-.6-.05-1.18-.15-1.72h-10z"
        fill="currentColor"
      />
    </svg>
  );

  return (
    <PageWrapper>
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="mx-auto w-full max-w-sm shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Ticket className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Canteen Control Center
          </CardTitle>
          <CardDescription>
            Staff sign-in. This is a restricted internal tool.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!firebaseReady && (
            <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              Firebase is not configured. Add the required `NEXT_PUBLIC_FIREBASE_*`
              variables to `.env.local`.
            </div>
          )}
          <form onSubmit={handleSignIn}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m.anderson@school.edu"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!!isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!!isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={!!isLoading}>
                {isLoading === "signin" ? (
                  <Skeleton className="mr-2 h-4 w-4 rounded-full" />
                ) : null}
                Sign In
              </Button>
              <Button variant="outline" className="w-full" disabled>
                <GoogleIcon className="mr-2 h-4 w-4" />
                Sign in with Google
              </Button>
            </div>
          </form>
          <Separator className="my-6" />
          <div className="space-y-2 text-center text-sm text-muted-foreground">
            <p>For demonstration purposes:</p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => handleDemoLogin("member")}
                disabled={!!isLoading}
              >
                {isLoading === "member" ? (
                  <Skeleton className="mr-2 h-4 w-4 rounded-full" />
                ) : null}
                Login as Member
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => handleDemoLogin("supervisor")}
                disabled={!!isLoading}
              >
                {isLoading === "supervisor" ? (
                  <Skeleton className="mr-2 h-4 w-4 rounded-full" />
                ) : null}
                Login as Supervisor
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => handleDemoLogin("admin")}
                disabled={!!isLoading}
              >
                {isLoading === "admin" ? (
                  <Skeleton className="mr-2 h-4 w-4 rounded-full" />
                ) : null}
                Login as Admin
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </PageWrapper>
  );
}
