import { notFound } from "next/navigation";
import { createBuilding, createUnitWithBuyer } from "@/app/actions/projects";
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

export default async function UnitsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      buildings: {
        orderBy: { name: "asc" },
        include: {
          units: {
            orderBy: { number: "asc" },
            include: { buyer: true },
          },
        },
      },
    },
  });
  if (!project) notFound();

  return (
    <>
      <PageHeader
        title="בניינים, דירות ורוכשים"
        description="היררכיה: פרויקט → בניין → דירה → רוכש. כל הרשומות שייכות לפרויקט זה בלבד."
      />

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>הוספת בניין</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createBuilding} className="flex gap-2 items-end">
              <input type="hidden" name="projectId" value={projectId} />
              <div className="flex-1 space-y-2">
                <Label htmlFor="buildingName">שם בניין</Label>
                <Input id="buildingName" name="name" required placeholder="בניין א׳" />
              </div>
              <Button type="submit">הוסף</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>הוספת דירה + רוכש</CardTitle>
          </CardHeader>
          <CardContent>
            {project.buildings.length === 0 ? (
              <p className="text-sm text-muted-foreground">יש ליצור בניין תחילה.</p>
            ) : (
              <form action={createUnitWithBuyer} className="grid gap-3 sm:grid-cols-2">
                <input type="hidden" name="projectId" value={projectId} />
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="buildingId">בניין</Label>
                  <select
                    id="buildingId"
                    name="buildingId"
                    required
                    className="w-full h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
                  >
                    {project.buildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number">מספר דירה</Label>
                  <Input id="number" name="number" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="floor">קומה</Label>
                  <Input id="floor" name="floor" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="buyerName">שם רוכש</Label>
                  <Input id="buyerName" name="buyerName" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">טלפון</Label>
                  <Input id="phone" name="phone" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">אימייל</Label>
                  <Input id="email" name="email" type="email" />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit">שמור דירה ורוכש</Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      {project.buildings.length === 0 ? (
        <EmptyState
          title="אין בניינים"
          description="הוסיפו בניין ואז דירות עם רוכשים."
        />
      ) : (
        <div className="space-y-6">
          {project.buildings.map((building) => (
            <Card key={building.id}>
              <CardHeader>
                <CardTitle>{building.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {building.units.length === 0 ? (
                  <p className="text-sm text-muted-foreground">אין דירות בבניין זה.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>דירה</TableHead>
                        <TableHead>קומה</TableHead>
                        <TableHead>רוכש</TableHead>
                        <TableHead>טלפון</TableHead>
                        <TableHead>אימייל</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {building.units.map((unit) => (
                        <TableRow key={unit.id}>
                          <TableCell>{unit.number}</TableCell>
                          <TableCell>{unit.floor || "—"}</TableCell>
                          <TableCell>{unit.buyer?.name || "—"}</TableCell>
                          <TableCell>{unit.buyer?.phone || "—"}</TableCell>
                          <TableCell>{unit.buyer?.email || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
