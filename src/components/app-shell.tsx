import Link from "next/link";
import {
  Building2,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  Home,
  ListTodo,
  Receipt,
  Truck,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "", label: "סקירה", icon: Home },
  { href: "/units", label: "בניינים ודירות", icon: Building2 },
  { href: "/requests", label: "בקשות שינוי", icon: ClipboardList },
  { href: "/matrix", label: "מחירון דקל", icon: FileSpreadsheet },
  { href: "/suppliers", label: "ספקים", icon: Truck },
  { href: "/tasks", label: "משימות", icon: ListTodo },
  { href: "/billing", label: "תיעוד חיובים", icon: Receipt },
  { href: "/reports", label: "דוחות", icon: BarChart3 },
];

export function AppShell({
  projectId,
  projectName,
  children,
}: {
  projectId?: string;
  projectName?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="md:w-64 shrink-0 bg-sidebar text-sidebar-foreground border-b md:border-b-0 md:border-l border-sidebar-border">
        <div className="p-5 border-b border-sidebar-border">
          <Link href="/" className="block">
            <div className="text-xs text-sidebar-primary tracking-wide">Nadlan2U Clone</div>
            <div className="text-lg font-semibold mt-1">שינויי דיירים</div>
            <div className="text-xs opacity-70 mt-1">ממשק מתאמת בלבד</div>
          </Link>
          {projectName && (
            <div className="mt-4 rounded-md bg-sidebar-accent px-3 py-2 text-sm">
              <div className="text-[11px] opacity-70">פרויקט פעיל</div>
              <div className="font-medium truncate">{projectName}</div>
            </div>
          )}
        </div>
        <nav className="p-3 flex md:flex-col gap-1 overflow-x-auto">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent whitespace-nowrap"
          >
            <Home className="size-4" />
            כל הפרויקטים
          </Link>
          {projectId &&
            nav.map((item) => {
              const href = `/projects/${projectId}${item.href}`;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href || "overview"}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent whitespace-nowrap",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
        </nav>
      </aside>
      <main className="flex-1 min-w-0">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</div>
      </main>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card/60 px-6 py-12 text-center">
      <FileText className="mx-auto size-8 text-muted-foreground mb-3" />
      <div className="font-medium">{title}</div>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
