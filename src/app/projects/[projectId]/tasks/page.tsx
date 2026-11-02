import { notFound } from "next/navigation";
import { createTask, toggleTask } from "@/app/actions/tasks";
import { EmptyState, PageHeader } from "@/components/app-shell";
import { TaskBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/statuses";

export default async function TasksPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) notFound();

  const [tasks, requests] = await Promise.all([
    prisma.task.findMany({
      where: { projectId },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
      include: { changeRequest: true },
    }),
    prisma.changeRequest.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="משימות ומעקבים"
        description="רשימת מעקבים למתאמת — עם או בלי קישור לבקשת שינוי."
      />

      <Card className="mb-6 max-w-2xl">
        <CardHeader>
          <CardTitle>משימה חדשה</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createTask} className="space-y-3">
            <input type="hidden" name="projectId" value={projectId} />
            <div className="space-y-2">
              <Label htmlFor="title">כותרת</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="changeRequestId">קישור לבקשה (אופציונלי)</Label>
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
              <Label htmlFor="dueDate">יעד</Label>
              <Input id="dueDate" name="dueDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">הערות</Label>
              <Textarea id="notes" name="notes" rows={2} />
            </div>
            <Button type="submit">הוסף</Button>
          </form>
        </CardContent>
      </Card>

      {tasks.length === 0 ? (
        <EmptyState title="אין משימות" description="הוסיפו מעקב ראשון." />
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="rounded-lg border bg-card px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{task.title}</span>
                  <TaskBadge status={task.status} />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  יעד: {formatDate(task.dueDate)}
                  {task.changeRequest
                    ? ` · בקשה: ${task.changeRequest.title}`
                    : ""}
                </div>
                {task.notes && (
                  <div className="text-sm mt-1 text-muted-foreground">{task.notes}</div>
                )}
              </div>
              <form action={toggleTask}>
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="id" value={task.id} />
                <input type="hidden" name="status" value={task.status} />
                <Button type="submit" variant="outline" size="sm">
                  {task.status === "done" ? "סמן כפתוחה" : "סמן כבוצעה"}
                </Button>
              </form>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
