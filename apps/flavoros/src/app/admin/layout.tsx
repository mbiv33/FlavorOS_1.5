import { AppShell } from "@/components/AppShell";
import { SessionGuard } from "@/components/SessionGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionGuard>
      <AppShell variant="admin">{children}</AppShell>
    </SessionGuard>
  );
}
