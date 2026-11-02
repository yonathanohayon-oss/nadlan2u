import { notFound } from "next/navigation";
import { createBillingDocument } from "@/app/actions/billing";
import { EmptyState, PageHeader } from "@/components/app-shell";
import { BillingTypeBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import {
  BILLING_DOC_TYPES,
  BILLING_DOC_TYPE_LABELS,
  formatDate,
  formatILS,
  type BillingDocType,
} from "@/lib/statuses";

export default async function BillingPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) notFound();

  const [docs, requests, quotes] = await Promise.all([
    prisma.billingDocument.findMany({
      where: { projectId },
      orderBy: { issuedAt: "desc" },
      include: {
        changeRequest: true,
        quote: true,
      },
    }),
    prisma.changeRequest.findMany({
      where: { projectId },
      select: { id: true, title: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.quote.findMany({
      where: { projectId },
      select: { id: true, changeRequestId: true, status: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const total = docs.reduce((s, d) => s + d.amount, 0);

  return (
    <>
      <PageHeader
        title="תיעוד חיובים"
        description="תיעוד בלבד למתאמת — ללא גבייה. סוגי מסמך מינימליים: דרישת תשלום / תיעוד חשבונית."
      />

      <Card className="mb-6 max-w-2xl">
        <CardHeader>
          <CardTitle>מסמך חיוב חדש</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createBillingDocument} className="grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="projectId" value={projectId} />
            <div className="space-y-2">
              <Label htmlFor="type">סוג</Label>
              <select
                id="type"
                name="type"
                required
                className="w-full h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
              >
                {BILLING_DOC_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {BILLING_DOC_TYPE_LABELS[t as BillingDocType]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">סכום (₪)</Label>
              <Input id="amount" name="amount" type="number" min={0} step={1} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="title">כותרת</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="changeRequestId">בקשה (אופציונלי)</Label>
              <select
                id="changeRequestId"
                name="changeRequestId"
                className="w-full h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
                defaultValue=""
              >
                <option value="">ללא</option>
                {requests.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quoteId">הצעה (אופציונלי)</Label>
              <select
                id="quoteId"
                name="quoteId"
                className="w-full h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
                defaultValue=""
              >
                <option value="">ללא</option>
                {quotes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.id.slice(0, 8)}… ({q.status})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">הערות</Label>
              <Textarea id="notes" name="notes" rows={2} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">שמור תיעוד</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mb-4 text-sm text-muted-foreground">
        סה״כ מתועד בפרויקט: <span className="font-semibold text-foreground">{formatILS(total)}</span>
      </div>

      {docs.length === 0 ? (
        <EmptyState
          title="אין מסמכי חיוב"
          description="תעדו דרישת תשלום או חשבונית אחרי אישור הצעה."
        />
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>סוג</TableHead>
                <TableHead>כותרת</TableHead>
                <TableHead>סכום</TableHead>
                <TableHead>בקשה</TableHead>
                <TableHead>תאריך</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <BillingTypeBadge type={d.type} />
                  </TableCell>
                  <TableCell>{d.title}</TableCell>
                  <TableCell>{formatILS(d.amount)}</TableCell>
                  <TableCell>{d.changeRequest?.title || "—"}</TableCell>
                  <TableCell>{formatDate(d.issuedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
