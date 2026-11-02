import { notFound } from "next/navigation";
import { createSupplier } from "@/app/actions/suppliers";
import { EmptyState, PageHeader } from "@/components/app-shell";
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

export default async function SuppliersPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) notFound();

  const suppliers = await prisma.supplier.findMany({
    where: { projectId },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { changeRequests: true } },
    },
  });

  return (
    <>
      <PageHeader
        title="ספקים"
        description="רישום ספקים לפרויקט ושיוך לביצוע בקשות. אין הזמנות רכש ב-MVP."
      />

      <Card className="mb-6 max-w-2xl">
        <CardHeader>
          <CardTitle>ספק חדש</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createSupplier} className="grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="projectId" value={projectId} />
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">שם</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialty">תחום</Label>
              <Input id="specialty" name="specialty" placeholder="חשמל, אינסטלציה…" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">טלפון</Label>
              <Input id="phone" name="phone" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">אימייל</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">הערות</Label>
              <Textarea id="notes" name="notes" rows={2} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">שמור ספק</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {suppliers.length === 0 ? (
        <EmptyState title="אין ספקים" description="הוסיפו ספק לרישום הפרויקט." />
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>שם</TableHead>
                <TableHead>תחום</TableHead>
                <TableHead>טלפון</TableHead>
                <TableHead>בקשות משויכות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.specialty || "—"}</TableCell>
                  <TableCell>{s.phone || "—"}</TableCell>
                  <TableCell>{s._count.changeRequests}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
