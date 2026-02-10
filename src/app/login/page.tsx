"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
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
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { firebaseReady } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { PageWrapper } from "@/components/motion/page-wrapper";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<"signin" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const { signIn } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast({
        variant: "destructive",
        title: "Missing credentials",
        description: "Enter your email and password to continue.",
      });
      return;
    }
    setIsLoading("signin");
    try {
      await signIn(email.trim().toLowerCase(), password);
      router.push("/dashboard");
    } catch (error) {
      let description = "Check your credentials and Firebase Auth settings.";
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case "auth/invalid-credential":
          case "auth/wrong-password":
          case "auth/user-not-found":
            description =
              "Email or password is incorrect. If you already changed your temporary password, use the new one.";
            break;
          case "auth/user-disabled":
            description = "This account is disabled. Contact an administrator.";
            break;
          case "auth/too-many-requests":
            description =
              "Too many attempts. Wait a few minutes and try again.";
            break;
          case "auth/operation-not-allowed":
            description =
              "Email/password sign-in is disabled in Firebase Auth.";
            break;
          default:
            description = error.message || description;
            break;
        }
      }
      toast({
        variant: "destructive",
        title: "Login Failed",
        description,
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
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center">
            <Image
              src="/student-council-logo.jpeg"
              alt="Student Council"
              width={72}
              height={72}
              className="h-16 w-16 object-contain dark:mix-blend-multiply dark:brightness-110"
            />
          </div>
          <CardTitle className="text-2xl font-bold">
            Student Council
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
          <form onSubmit={handleSignIn} noValidate>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m.anderson@school.edu"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  inputMode="email"
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
                  autoComplete="current-password"
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
        </CardContent>
      </Card>
      </div>
    </PageWrapper>
  );
}
