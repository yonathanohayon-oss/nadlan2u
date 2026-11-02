import Link from "next/link";
import { notFound } from "next/navigation";
import {
  recordBuyerApproval,
  recordDeveloperApproval,
  submitQuoteForApproval,
} from "@/app/actions/quotes";
import { updateChangeRequestStatus, updateExecution } from "@/app/actions/requests";
import { uploadDocument } from "@/app/actions/documents";
import { createTask } from "@/app/actions/tasks";
import { PageHeader } from "@/components/app-shell";
import { QuoteBuilder } from "@/components/quote-builder";
import {
  CrStatusBadge,
  ExecutionBadge,
  QuoteStatusBadge,
} from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
import { cn } from "@/lib/utils";
  CHANGE_REQUEST_STATUSES,
  CHANGE_REQUEST_STATUS_LABELS,
  EXECUTION_STATUSES,
  EXECUTION_STATUS_LABELS,
  formatDate,
  formatILS,
  type ChangeRequestStatus,
  type ExecutionStatus,
} from "@/lib/statuses";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; requestId: string }>;
}) {
  const { projectId, requestId } = await params;

  const cr = await prisma.changeRequest.findFirst({
    where: { id: requestId, projectId },
    include: {
      buyer: true,
      unit: { include: { building: true } },
      supplier: true,
      documents: { orderBy: { createdAt: "desc" } },
      tasks: { orderBy: { createdAt: "desc" } },
      quotes: {
        orderBy: { createdAt: "desc" },
        include: { lines: true },
      },
    },
  });
  if (!cr) notFound();

  const [matrix, suppliers] = await Promise.all([
    prisma.priceMatrixItem.findMany({
      where: { projectId },
      orderBy: [{ chapter: "asc" }, { code: "asc" }],
    }),
    prisma.supplier.findMany({
      where: { projectId },
      orderBy: { name: "asc" },
    }),
  ]);

  const latestQuote = cr.quotes[0] ?? null;
  const quoteTotal = latestQuote
    ? latestQuote.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0)
    : 0;

  return (
    <>
      <PageHeader
        title={cr.title}
        description={`${cr.unit.building.name} · דירה ${cr.unit.number} · ${cr.buyer.name}`}
        actions={
          <Link
            href={`/projects/${projectId}/requests`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            לכל הבקשות
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2 mb-6">
        <CrStatusBadge status={cr.status} />
        <ExecutionBadge status={cr.executionStatus} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>פרטי הבקשה</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="whitespace-pre-wrap">{cr.description || "אין תיאור."}</p>
              {cr.notes && (
                <div className="rounded-md bg-muted/60 px-3 py-2 text-muted-foreground">
                  הערות: {cr.notes}
                </div>
              )}
              <Separator />
              <form
                action={updateChangeRequestStatus}
                className="flex flex-wrap items-end gap-2"
              >
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="id" value={cr.id} />
                <div className="space-y-1">
                  <Label htmlFor="status">עדכון סטטוס</Label>
                  <select
                    id="status"
                    name="status"
                    defaultValue={cr.status}
                    className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
                  >
                    {CHANGE_REQUEST_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {CHANGE_REQUEST_STATUS_LABELS[s as ChangeRequestStatus]}
                      </option>
                    ))}
                  </select>
                </div>
                <Button type="submit" variant="secondary">
                  שמור סטטוס
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>הצעת מחיר (מחירון דקל)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!latestQuote && (
                <QuoteBuilder
                  projectId={projectId}
                  changeRequestId={cr.id}
                  items={matrix}
                />
              )}

              {latestQuote && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <QuoteStatusBadge status={latestQuote.status} />
                    <span className="text-sm text-muted-foreground">
                      נוצרה ב־{formatDate(latestQuote.createdAt)}
                    </span>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>סעיף</TableHead>
                        <TableHead>כמות</TableHead>
                        <TableHead>מחיר יח׳</TableHead>
                        <TableHead>סה״כ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {latestQuote.lines.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell>
                            <div className="font-medium text-sm">{line.description}</div>
                            <div className="text-xs text-muted-foreground">{line.unit}</div>
                          </TableCell>
                          <TableCell>{line.quantity}</TableCell>
                          <TableCell>{formatILS(line.unitPrice)}</TableCell>
                          <TableCell>
                            {formatILS(line.quantity * line.unitPrice)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="text-left font-semibold">
                    סה״כ הצעה: {formatILS(quoteTotal)}
                  </div>

                  {latestQuote.status === "draft" && (
                    <form action={submitQuoteForApproval}>
                      <input type="hidden" name="projectId" value={projectId} />
                      <input type="hidden" name="quoteId" value={latestQuote.id} />
                      <input
                        type="hidden"
                        name="changeRequestId"
                        value={cr.id}
                      />
                      <Button type="submit">שלח לאישור כפול</Button>
                    </form>
                  )}

                  {(latestQuote.status === "pending_approval" ||
                    latestQuote.status === "approved") && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-md border p-3 space-y-2">
                        <div className="font-medium text-sm">אישור רוכש</div>
                        {latestQuote.buyerApprovedAt ? (
                          <p className="text-sm text-muted-foreground">
                            נרשם ב־{formatDate(latestQuote.buyerApprovedAt)}
                            <br />
                            {latestQuote.buyerApprovedByNote}
                          </p>
                        ) : (
                          <form action={recordBuyerApproval} className="space-y-2">
                            <input type="hidden" name="projectId" value={projectId} />
                            <input type="hidden" name="quoteId" value={latestQuote.id} />
                            <input
                              type="hidden"
                              name="changeRequestId"
                              value={cr.id}
                            />
                            <Textarea
                              name="note"
                              placeholder="הערה (אופציונלי)"
                              rows={2}
                            />
                            <Button type="submit" size="sm">
                              רשום אישור רוכש
                            </Button>
                          </form>
                        )}
                      </div>
                      <div className="rounded-md border p-3 space-y-2">
                        <div className="font-medium text-sm">אישור יזם/קבלן</div>
                        {latestQuote.developerApprovedAt ? (
                          <p className="text-sm text-muted-foreground">
                            נרשם ב־{formatDate(latestQuote.developerApprovedAt)}
                            <br />
                            {latestQuote.developerApprovedByNote}
                          </p>
                        ) : (
                          <form
                            action={recordDeveloperApproval}
                            className="space-y-2"
                          >
                            <input type="hidden" name="projectId" value={projectId} />
                            <input type="hidden" name="quoteId" value={latestQuote.id} />
                            <input
                              type="hidden"
                              name="changeRequestId"
                              value={cr.id}
                            />
                            <Textarea
                              name="note"
                              placeholder="הערה (אופציונלי)"
                              rows={2}
                            />
                            <Button type="submit" size="sm">
                              רשום אישור יזם/קבלן
                            </Button>
                          </form>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>מסמכים</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form action={uploadDocument} className="grid gap-3 sm:grid-cols-2">
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="changeRequestId" value={cr.id} />
                {latestQuote && (
                  <input type="hidden" name="quoteId" value={latestQuote.id} />
                )}
                <div className="space-y-2">
                  <Label htmlFor="docName">שם מסמך</Label>
                  <Input id="docName" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file">קובץ</Label>
                  <Input id="file" name="file" type="file" required />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" variant="secondary">
                    העלה מסמך
                  </Button>
                </div>
              </form>
              <Separator />
              {cr.documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">אין מסמכים מצורפים.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {cr.documents.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                    >
                      <div>
                        <div className="font-medium">{doc.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {doc.filename} · {formatDate(doc.createdAt)}
                        </div>
                      </div>
                      <a
                        className="text-primary underline text-xs"
                        href={`/api/documents/${doc.id}?projectId=${projectId}`}
                      >
                        הורדה
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>ביצוע וספק</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={updateExecution} className="space-y-3">
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="id" value={cr.id} />
                <div className="space-y-2">
                  <Label htmlFor="supplierId">ספק מבצע</Label>
                  <select
                    id="supplierId"
                    name="supplierId"
                    defaultValue={cr.supplierId || ""}
                    className="w-full h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
                  >
                    <option value="">ללא ספק</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                        {s.specialty ? ` (${s.specialty})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="executionStatus">סטטוס ביצוע</Label>
                  <select
                    id="executionStatus"
                    name="executionStatus"
                    defaultValue={cr.executionStatus}
                    className="w-full h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
                  >
                    {EXECUTION_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {EXECUTION_STATUS_LABELS[s as ExecutionStatus]}
                      </option>
                    ))}
                  </select>
                </div>
                <Button type="submit" className="w-full">
                  עדכן ביצוע
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>משימה / מעקב</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form action={createTask} className="space-y-3">
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="changeRequestId" value={cr.id} />
                <div className="space-y-2">
                  <Label htmlFor="taskTitle">כותרת</Label>
                  <Input id="taskTitle" name="title" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">יעד</Label>
                  <Input id="dueDate" name="dueDate" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taskNotes">הערות</Label>
                  <Textarea id="taskNotes" name="notes" rows={2} />
                </div>
                <Button type="submit" variant="secondary" className="w-full">
                  הוסף משימה
                </Button>
              </form>
              <Separator />
              {cr.tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">אין משימות לבקשה.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {cr.tasks.map((t) => (
                    <li key={t.id} className="rounded-md border px-3 py-2">
                      <div className="font-medium">{t.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {t.status === "done" ? "בוצעה" : "פתוחה"} · יעד{" "}
                        {formatDate(t.dueDate)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
