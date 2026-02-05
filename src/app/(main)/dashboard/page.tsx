import { PageHeader } from "@/components/shared/page-header";
import { BreakStatusCard } from "@/components/dashboard/break-status-card";

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-0">
      <PageHeader
        title="Dashboard"
        description="Overview of canteen pass activity."
      />
      <div className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <BreakStatusCard />
        </div>
      </div>
    </div>
  );
}
