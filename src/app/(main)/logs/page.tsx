import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { LogsTable } from "@/components/logs/logs-table";
import { Log } from "@/lib/types";

const mockLogs: Log[] = Array.from({ length: 50 }, (_, i) => {
  const status = ["active", "expired", "revoked"][Math.floor(Math.random() * 3)] as "active" | "expired" | "revoked";
  const issuedAt = Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 7);
  return {
    id: `log-${i + 1}`,
    studentName: ["Leia Organa", "Han Solo", "Luke Skywalker", "Ben Kenobi", "R2-D2"][Math.floor(Math.random() * 5)],
    reason: ["Forgot lunch", "Library visit", "Medical", "Tutor session", "Club meeting"][Math.floor(Math.random() * 5)],
    issuedBy: ["Dr. Evelyn Reed", "Alex Chen"][Math.floor(Math.random() * 2)],
    issuedAt: issuedAt,
    expiresAt: issuedAt + 30 * 60 * 1000,
    status: status,
  };
});


export default function LogsPage() {
  return (
    <div>
      <PageHeader
        title="Pass Logs"
        description="A permanent and immutable record of all passes issued."
      />
      <Card>
        <CardContent className="pt-6">
            <LogsTable data={mockLogs} />
        </CardContent>
      </Card>
    </div>
  );
}
