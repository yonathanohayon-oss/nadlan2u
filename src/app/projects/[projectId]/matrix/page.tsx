import { notFound } from "next/navigation";
import { uploadMatrixCsv } from "@/app/actions/documents";
import { EmptyState, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { formatILS } from "@/lib/statuses";

export default async function MatrixPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) notFound();

  const items = await prisma.priceMatrixItem.findMany({
    where: { projectId },
    orderBy: [{ chapter: "asc" }, { code: "asc" }],
  });

  return (
    <>
      <PageHeader
        title="מחירון דקל (לפרויקט)"
        description="מטריצת סעיפים ומחירים לשימוש בהצעות מחיר. ב-MVP קיים מחירון דוגמה; ניתן להעלות CSV פשוט."
      />

      <Card className="mb-6 max-w-xl">
        <CardHeader>
          <CardTitle>העלאת CSV</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            כותרות: <code>code,chapter,description,unit,unitPrice</code>
          </p>
          <form action={uploadMatrixCsv} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="projectId" value={projectId} />
            <div className="space-y-2">
              <Label htmlFor="file">קובץ CSV</Label>
              <Input id="file" name="file" type="file" accept=".csv,text/csv" required />
            </div>
            <Button type="submit" variant="secondary">
              העלה / עדכן
            </Button>
          </form>
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <EmptyState title="מחירון ריק" description="העלו CSV או צרו פרויקט חדש עם דוגמה." />
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>קוד</TableHead>
                <TableHead>פרק</TableHead>
                <TableHead>תיאור</TableHead>
                <TableHead>יחידה</TableHead>
                <TableHead>מחיר</TableHead>
                <TableHead>מקור</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs">{item.code}</TableCell>
                  <TableCell>{item.chapter}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>{formatILS(item.unitPrice)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {item.source}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
