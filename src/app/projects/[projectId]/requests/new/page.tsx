import Link from "next/link";
import { notFound } from "next/navigation";
import { createChangeRequest } from "@/app/actions/requests";
import { PageHeader } from "@/components/app-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export default async function NewRequestPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      buildings: {
        include: {
          units: { include: { buyer: true }, orderBy: { number: "asc" } },
        },
        orderBy: { name: "asc" },
      },
    },
  });
  if (!project) notFound();

  const units = project.buildings.flatMap((b) =>
    b.units
      .filter((u) => u.buyer)
      .map((u) => ({
        id: u.id,
        label: `${b.name} · דירה ${u.number} · ${u.buyer!.name}`,
      })),
  );

  return (
    <>
      <PageHeader
        title="בקשת שינוי חדשה"
        description="בחרו דירה/רוכש ורשמו את הבקשה. הסטטוס ההתחלתי: פתוחה."
        actions={
          <Link
            href={`/projects/${projectId}/requests`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            חזרה
          </Link>
        }
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>פרטי הבקשה</CardTitle>
        </CardHeader>
        <CardContent>
          {units.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              אין דירות עם רוכשים.{" "}
              <Link
                className="underline"
                href={`/projects/${projectId}/units`}
              >
                הוסיפו דירה תחילה
              </Link>
              .
            </p>
          ) : (
            <form action={createChangeRequest} className="space-y-4">
              <input type="hidden" name="projectId" value={projectId} />
              <div className="space-y-2">
                <Label htmlFor="unitId">דירה / רוכש</Label>
                <select
                  id="unitId"
                  name="unitId"
                  required
                  className="w-full h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">כותרת</Label>
                <Input id="title" name="title" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">תיאור</Label>
                <Textarea id="description" name="description" rows={4} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">הערות פנימיות</Label>
                <Textarea id="notes" name="notes" rows={2} />
              </div>
              <Button type="submit">פתח בקשה</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </>
  );
}
