import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState, PageHeader } from "@/components/app-shell";
import { CrStatusBadge, ExecutionBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/statuses";
import { cn } from "@/lib/utils";

export default async function RequestsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) notFound();

  const requests = await prisma.changeRequest.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    include: {
      buyer: true,
      unit: { include: { building: true } },
      supplier: true,
      quotes: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return (
    <>
      <PageHeader
        title="בקשות שינוי"
        description="רישום בקשות, מעקב סטטוסים וקישור להצעות מחיר ואישורים."
        actions={
          <Link href={`/projects/${projectId}/requests/new`} className={cn(buttonVariants())}>
            בקשה חדשה
          </Link>
        }
      />

      {requests.length === 0 ? (
        <EmptyState
          title="אין בקשות שינוי"
          description="פתחו בקשה ראשונה לדירה בפרויקט."
        />
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>כותרת</TableHead>
                <TableHead>דירה / רוכש</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>ביצוע</TableHead>
                <TableHead>ספק</TableHead>
                <TableHead>נוצר</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((cr) => (
                <TableRow key={cr.id}>
                  <TableCell>
                    <Link
                      href={`/projects/${projectId}/requests/${cr.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {cr.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">
                    {cr.unit.building.name} · {cr.unit.number}
                    <div className="text-muted-foreground">{cr.buyer.name}</div>
                  </TableCell>
                  <TableCell>
                    <CrStatusBadge status={cr.status} />
                  </TableCell>
                  <TableCell>
                    <ExecutionBadge status={cr.executionStatus} />
                  </TableCell>
                  <TableCell>{cr.supplier?.name || "—"}</TableCell>
                  <TableCell>{formatDate(cr.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
