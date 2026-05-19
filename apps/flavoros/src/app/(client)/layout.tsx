import { AppShell } from "@/components/AppShell";
import { SessionGuard } from "@/components/SessionGuard";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionGuard>
      <AppShell variant="client">{children}</AppShell>
    </SessionGuard>
  );
}
