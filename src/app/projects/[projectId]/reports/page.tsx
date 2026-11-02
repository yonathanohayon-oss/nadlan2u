import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CrStatusBadge, ExecutionBadge } from "@/components/status-badge";
import { prisma } from "@/lib/prisma";
import {
  CHANGE_REQUEST_STATUS_LABELS,
  formatILS,
  type ChangeRequestStatus,
} from "@/lib/statuses";

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) notFound();

  const [requests, quotes, billing] = await Promise.all([
    prisma.changeRequest.findMany({
      where: { projectId },
      include: {
        buyer: true,
        unit: { include: { building: true } },
        supplier: true,
        quotes: { include: { lines: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.quote.findMany({
      where: { projectId },
      include: { lines: true },
    }),
    prisma.billingDocument.findMany({ where: { projectId } }),
  ]);

  const byStatus = requests.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  const approvedQuoteTotal = quotes
    .filter((q) => q.status === "approved")
    .reduce(
      (sum, q) => sum + q.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0),
      0,
    );

  const billingTotal = billing.reduce((s, d) => s + d.amount, 0);

  return (
    <>
      <PageHeader
        title="דוחות ליזם / קבלן"
        description={`סיכום לפרויקט ${project.name} — לייצוא/שיתוף קל עם ${project.developerName} / ${project.contractorName}.`}
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">בקשות</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{requests.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              סה״כ הצעות מאושרות
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {formatILS(approvedQuoteTotal)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              סה״כ תיעוד חיובים
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {formatILS(billingTotal)}
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>פילוח סטטוסים</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {Object.keys(byStatus).length === 0 && (
            <p className="text-sm text-muted-foreground">אין נתונים.</p>
          )}
          {Object.entries(byStatus).map(([status, count]) => (
            <div
              key={status}
              className="rounded-md border px-3 py-2 text-sm min-w-[8rem]"
            >
              <div className="text-muted-foreground text-xs mb-1">
                {CHANGE_REQUEST_STATUS_LABELS[status as ChangeRequestStatus] ||
                  status}
              </div>
              <div className="text-xl font-semibold">{count}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>בקשה</TableHead>
              <TableHead>דירה / רוכש</TableHead>
              <TableHead>סטטוס</TableHead>
              <TableHead>ביצוע</TableHead>
              <TableHead>ספק</TableHead>
              <TableHead>סה״כ הצעות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((r) => {
              const total = r.quotes.reduce(
                (sum, q) =>
                  sum + q.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0),
                0,
              );
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.title}</TableCell>
                  <TableCell className="text-sm">
                    {r.unit.building.name} · {r.unit.number}
                    <div className="text-muted-foreground">{r.buyer.name}</div>
                  </TableCell>
                  <TableCell>
                    <CrStatusBadge status={r.status} />
                  </TableCell>
                  <TableCell>
                    <ExecutionBadge status={r.executionStatus} />
                  </TableCell>
                  <TableCell>{r.supplier?.name || "—"}</TableCell>
                  <TableCell>{formatILS(total)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
