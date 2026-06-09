"use client";

import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { OverviewPanel } from "@/components/admin/overview-panel";
import { UsersPanel } from "@/components/admin/users-panel";
import { GroupsPanel } from "@/components/admin/groups-panel";

type AdminTab = "overview" | "users" | "groups";

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>("overview");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administração"
        description="Central de gestão de usuários, grupos e permissões"
      />
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as AdminTab)}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="groups">Grupos</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <OverviewPanel onSwitchTab={setTab} />
        </TabsContent>
        <TabsContent value="users">
          <UsersPanel showHeader={false} />
        </TabsContent>
        <TabsContent value="groups">
          <GroupsPanel showHeader={false} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
