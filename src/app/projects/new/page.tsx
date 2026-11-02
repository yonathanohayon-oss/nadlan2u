import Link from "next/link";
import { createProject } from "@/app/actions/projects";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export default function NewProjectPage() {
  return (
    <AppShell>
      <PageHeader
        title="פרויקט חדש"
        description="יצירת פרויקט מבודד עם מחירון דקל לדוגמה."
        actions={
          <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
            חזרה
          </Link>
        }
      />
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>פרטי הפרויקט</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createProject} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">שם הפרויקט</Label>
              <Input id="name" name="name" required placeholder="למשל: רמת גן גנים" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="developerName">שם היזם</Label>
              <Input id="developerName" name="developerName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contractorName">שם הקבלן</Label>
              <Input id="contractorName" name="contractorName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">הערות</Label>
              <Textarea id="notes" name="notes" rows={3} />
            </div>
            <Button type="submit">צור פרויקט</Button>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}
