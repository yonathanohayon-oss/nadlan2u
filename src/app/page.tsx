import Link from "next/link";
import { AppShell, EmptyState, PageHeader } from "@/components/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/statuses";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          changeRequests: true,
          buyers: true,
          tasks: true,
        },
      },
    },
  });

  return (
    <AppShell>
      <PageHeader
        title="פרויקטים"
        description="כל פרויקט מבודד לחלוטין — נתונים, מחירון, ספקים ובקשות לא חוצים בין פרויקטים."
        actions={
          <Link href="/projects/new" className={cn(buttonVariants())}>
            פרויקט חדש
          </Link>
        }
      />

      {projects.length === 0 ? (
        <EmptyState
          title="אין פרויקטים עדיין"
          description="צרו פרויקט ראשון כדי להתחיל לנהל בקשות שינוי."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((p) => (
            <Card key={p.id} className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">
                  <Link
                    href={`/projects/${p.id}`}
                    className="text-foreground hover:text-primary hover:underline"
                  >
                    {p.name}
                  </Link>
                </CardTitle>
                <CardDescription>
                  יזם: {p.developerName} · קבלן: {p.contractorName}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3">
                <div className="space-y-1">
                  <div>בקשות שינוי: {p._count.changeRequests}</div>
                  <div>רוכשים: {p._count.buyers}</div>
                  <div>משימות: {p._count.tasks}</div>
                  <div className="pt-2 text-xs">נוצר ב־{formatDate(p.createdAt)}</div>
                </div>
                <Link
                  href={`/projects/${p.id}`}
                  className={cn(buttonVariants({ size: "sm" }), "inline-flex")}
                >
                  כניסה לפרויקט
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
