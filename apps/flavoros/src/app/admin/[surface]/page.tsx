import { notFound } from "next/navigation";

import { AdminSurfacePanel } from "@/components/admin/AdminSurfacePanel";
import { Header } from "@/components/Header";
import { getAdminSurface } from "@/lib/admin-surfaces";

export default async function AdminSurfacePage({
  params,
}: {
  params: Promise<{ surface: string }>;
}) {
  const { surface } = await params;
  const data = getAdminSurface(surface);
  if (!data) notFound();

  return (
    <>
      <Header title={data.title} nextFocus={data.subtitle} />
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <AdminSurfacePanel surface={surface} />
      </div>
    </>
  );
}
