import { AuthProvider } from "@/hooks/use-auth";
import { AppShell } from "@/components/layout/app-shell";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}
