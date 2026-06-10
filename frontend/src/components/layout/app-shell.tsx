"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShieldOff } from "lucide-react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-auth";

const PUBLIC_ROUTES = ["/login"];

// Mapa de prefixo de rota -> área. Se a rota não está no mapa, é livre.
const ROUTE_AREAS: Array<{ prefix: string; area: string }> = [
  { prefix: "/clients", area: "clientes" },
  { prefix: "/contracts", area: "contratos" },
  { prefix: "/proposals", area: "propostas" },
  { prefix: "/farol", area: "farol" },
  { prefix: "/projects", area: "gantt" },
  { prefix: "/capacity", area: "capacidade" },
  { prefix: "/people", area: "pessoas" },
  { prefix: "/allocations", area: "pessoas" },
];

const ADMIN_PREFIXES = ["/admin"];

// Rotas sob /admin que são liberadas por área (não exigem is_admin).
const ADMIN_AREA_EXCEPTIONS: Array<{ prefix: string; area: string }> = [
  { prefix: "/admin/groups", area: "gestao_grupos" },
];

function getRouteArea(pathname: string): string | null {
  if (pathname === "/") return "dashboard";
  for (const { prefix, area } of ROUTE_AREAS) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return area;
  }
  return null;
}

function isAdminRoute(pathname: string): boolean {
  return ADMIN_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC_ROUTES.includes(pathname);
  const { data: user, isLoading, error } = useCurrentUser();

  useEffect(() => {
    if (!isPublic && !isLoading && (error || !user)) {
      const next = encodeURIComponent(pathname);
      router.replace(`/login?next=${next}`);
    }
  }, [isPublic, isLoading, error, user, pathname, router]);

  if (isPublic) {
    return <main className="min-h-screen">{children}</main>;
  }

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse text-sm text-muted-foreground">
          Carregando...
        </div>
      </div>
    );
  }

  // Verifica acesso por área (perfil/admin têm regras próprias)
  const isAdminArea = isAdminRoute(pathname);
  const adminException = ADMIN_AREA_EXCEPTIONS.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );
  const requiredArea = getRouteArea(pathname);
  const hasAccess =
    user.is_admin ||
    (adminException
      ? user.areas.includes(adminException.area)
      : isAdminArea
        ? false
        : requiredArea
          ? user.areas.includes(requiredArea)
          : true);

  if (!hasAccess) {
    return (
      <div className="flex h-screen">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
            <ShieldOff className="h-12 w-12 text-muted-foreground" />
            <h1 className="text-2xl font-semibold">Sem acesso a esta área</h1>
            <p className="max-w-md text-sm text-muted-foreground">
              {isAdminArea
                ? "Esta área é restrita a administradores."
                : "Você não está em nenhum grupo com acesso a esta área. Fale com um administrador."}
            </p>
            <Button asChild>
              <Link href="/">Voltar ao dashboard</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
