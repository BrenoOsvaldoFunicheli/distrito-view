"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  Users,
  Building2,
  FileText,
  Calendar,
  GanttChart,
  UserCheck,
  TrendingUp,
  KanbanSquare,
  Lightbulb,
  FolderKanban,
  Shield,
  User as UserIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { mutate } from "swr";
import { useCurrentUser } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  area?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const dashboardItem: NavItem = {
  href: "/",
  label: "Dashboard",
  icon: LayoutDashboard,
  area: "dashboard",
};

interface NavGroupDef extends NavGroup {
  adminOnly?: boolean;
}

const groups: NavGroupDef[] = [
  {
    label: "Indicadores",
    items: [
      { href: "/projects", label: "Gantt Projetos", icon: GanttChart, area: "gantt" },
      {
        href: "/proposals",
        label: "Propostas Técnicas",
        icon: KanbanSquare,
        area: "propostas",
      },
      { href: "/farol", label: "Farol", icon: Lightbulb, area: "farol" },
    ],
  },
  {
    label: "Clientes",
    items: [
      { href: "/clients", label: "Clientes", icon: Building2, area: "clientes" },
      { href: "/contracts", label: "Contratos", icon: FileText, area: "contratos" },
      {
        href: "/portfolio",
        label: "Portfólio",
        icon: FolderKanban,
        area: "contratos",
      },
    ],
  },
  {
    label: "Pessoas",
    items: [
      { href: "/people", label: "Pessoas", icon: Users, area: "pessoas" },
      {
        href: "/allocations/people",
        label: "Alocação Pessoas",
        icon: UserCheck,
        area: "pessoas",
      },
      { href: "/allocations", label: "Timeline", icon: Calendar, area: "pessoas" },
      { href: "/capacity", label: "Capacidade", icon: TrendingUp, area: "capacidade" },
    ],
  },
  {
    label: "Administração",
    adminOnly: true,
    items: [
      { href: "/admin", label: "Painel Admin", icon: LayoutDashboard },
      { href: "/admin/users", label: "Usuários", icon: Shield },
      { href: "/admin/groups", label: "Grupos", icon: Users },
    ],
  },
];

function canAccess(item: NavItem, isAdmin: boolean, areas: string[]): boolean {
  if (isAdmin) return true;
  if (!item.area) return true;
  return areas.includes(item.area);
}

const STORAGE_KEY = "distrito.sidebar.collapsed";
const GROUPS_STORAGE_KEY = "distrito.sidebar.openGroups";

function isItemActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/admin") return pathname === "/admin";
  if (href === "/allocations")
    return pathname === "/allocations" || pathname === "/allocations/new";
  return pathname.startsWith(href);
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await api.post("/api/v1/auth/logout", {});
    } catch {
      // ignora erros do logout
    } finally {
      await mutate("/api/v1/auth/me", undefined, false);
      router.replace("/login");
    }
  };

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    groups.forEach((g) => {
      initial[g.label] = true;
    });
    return initial;
  });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "1") setCollapsed(true);
    const storedGroups = localStorage.getItem(GROUPS_STORAGE_KEY);
    if (storedGroups) {
      try {
        setOpenGroups((prev) => ({ ...prev, ...JSON.parse(storedGroups) }));
      } catch {
        // ignore malformed value
      }
    }
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  };

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => {
      const next = { ...prev, [label]: !prev[label] };
      localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const renderItem = (item: NavItem) => {
    const isActive = isItemActive(pathname, item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        title={collapsed ? item.label : undefined}
        className={cn(
          "flex items-center rounded-lg text-sm font-medium transition-colors",
          collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        )}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r bg-card transition-all duration-200",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center border-b",
          collapsed ? "justify-center px-2" : "justify-between px-6",
        )}
      >
        {!collapsed && <h1 className="text-xl font-bold">Distrito</h1>}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
          className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
      <nav
        className={cn("flex-1 overflow-y-auto", collapsed ? "p-2" : "p-4")}
      >
        {(user?.is_admin || canAccess(dashboardItem, false, user?.areas ?? [])) && (
          <div className="space-y-1">{renderItem(dashboardItem)}</div>
        )}
        {groups
          .filter((g) => !g.adminOnly || user?.is_admin)
          .map((group) => {
            const visibleItems = group.items.filter((it) =>
              canAccess(it, !!user?.is_admin, user?.areas ?? []),
            );
            if (visibleItems.length === 0) return null;
            const open = openGroups[group.label] ?? true;
            if (collapsed) {
              return (
                <div key={group.label} className="mt-3 space-y-1">
                  {visibleItems.map(renderItem)}
                </div>
              );
            }
            const groupHasActive = visibleItems.some((i) =>
              isItemActive(pathname, i.href),
            );
            return (
              <div key={group.label} className="mt-4">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  className="flex w-full items-center justify-between px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                >
                  <span>{group.label}</span>
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 transition-transform",
                      !open && "-rotate-90",
                    )}
                  />
                </button>
                {(open || groupHasActive) && (
                  <div className="mt-1 space-y-1">
                    {visibleItems.map(renderItem)}
                  </div>
                )}
              </div>
            );
          })}
      </nav>
      <div className={cn("border-t space-y-1", collapsed ? "p-2" : "p-3")}>
        {!collapsed && user && (
          <div className="mb-2 px-2 text-xs">
            <p className="font-medium truncate">{user.name || user.email}</p>
            {user.name && (
              <p className="truncate text-muted-foreground">{user.email}</p>
            )}
          </div>
        )}
        <Link
          href="/perfil"
          title={collapsed ? "Meu perfil" : undefined}
          className={cn(
            "flex w-full items-center rounded-lg text-sm font-medium transition-colors",
            collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2",
            pathname.startsWith("/perfil")
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          )}
        >
          <UserIcon className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Meu perfil</span>}
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          title={collapsed ? "Sair" : undefined}
          className={cn(
            "flex w-full items-center rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
            collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2",
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{loggingOut ? "Saindo..." : "Sair"}</span>}
        </button>
      </div>
    </aside>
  );
}
