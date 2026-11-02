import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app-shell";
import { CrStatusBadge, TaskBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { formatDate, formatILS } from "@/lib/statuses";
import { cn } from "@/lib/utils";

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      changeRequests: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          buyer: true,
          unit: { include: { building: true } },
        },
      },
      tasks: {
        where: { status: "open" },
        orderBy: { dueDate: "asc" },
        take: 5,
      },
      billingDocs: true,
      _count: {
        select: {
          changeRequests: true,
          buyers: true,
          suppliers: true,
          tasks: true,
        },
      },
    },
  });
  if (!project) notFound();

  const billingTotal = project.billingDocs.reduce((s, d) => s + d.amount, 0);

  return (
    <>
      <PageHeader
        title={project.name}
        description={`יזם: ${project.developerName} · קבלן: ${project.contractorName}`}
        actions={
          <>
            <Link href={`/projects/${projectId}/requests/new`} className={cn(buttonVariants())}>
              בקשת שינוי חדשה
            </Link>
            <Link
              href={`/projects/${projectId}/reports`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              דוחות
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { label: "בקשות שינוי", value: project._count.changeRequests },
          { label: "רוכשים", value: project._count.buyers },
          { label: "ספקים", value: project._count.suppliers },
          { label: "משימות פתוחות", value: project.tasks.length },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">{stat.value}</CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>בקשות אחרונות</CardTitle>
            <Link
              href={`/projects/${projectId}/requests`}
              className={cn(buttonVariants({ size: "sm", variant: "ghost" }))}
            >
              הכל
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {project.changeRequests.length === 0 && (
              <p className="text-sm text-muted-foreground">אין בקשות עדיין.</p>
            )}
            {project.changeRequests.map((cr) => (
              <Link
                key={cr.id}
                href={`/projects/${projectId}/requests/${cr.id}`}
                className="block rounded-md border border-border px-3 py-2 hover:bg-muted/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium text-sm">{cr.title}</div>
                  <CrStatusBadge status={cr.status} />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {cr.unit.building.name} · דירה {cr.unit.number} · {cr.buyer.name}
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>משימות פתוחות</CardTitle>
            <Link
              href={`/projects/${projectId}/tasks`}
              className={cn(buttonVariants({ size: "sm", variant: "ghost" }))}
            >
              הכל
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {project.tasks.length === 0 && (
              <p className="text-sm text-muted-foreground">אין משימות פתוחות.</p>
            )}
            {project.tasks.map((task) => (
              <div
                key={task.id}
                className="rounded-md border border-border px-3 py-2 flex items-start justify-between gap-2"
              >
                <div>
                  <div className="text-sm font-medium">{task.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    יעד: {formatDate(task.dueDate)}
                  </div>
                </div>
                <TaskBadge status={task.status} />
              </div>
            ))}
            <div className="pt-2 text-sm text-muted-foreground border-t">
              סה״כ תיעוד חיובים בפרויקט: {formatILS(billingTotal)}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
