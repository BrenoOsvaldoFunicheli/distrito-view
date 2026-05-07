"use client";

import { useEffect, useState } from "react";
import { mutate } from "swr";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/page-header";
import { useCurrentUser } from "@/hooks/use-auth";
import { api, ApiError } from "@/lib/api";

export default function PerfilPage() {
  const { data: user } = useCurrentUser();
  const [name, setName] = useState("");
  const [profileMsg, setProfileMsg] = useState<{
    text: string;
    error: boolean;
  } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwMsg, setPwMsg] = useState<{ text: string; error: boolean } | null>(
    null,
  );
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    if (user) setName(user.name || "");
  }, [user]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      await api.put("/api/v1/auth/me", { name: name || null });
      await mutate("/api/v1/auth/me");
      setProfileMsg({ text: "Nome atualizado.", error: false });
    } catch (err) {
      setProfileMsg({
        text: err instanceof ApiError ? err.detail : "Erro",
        error: true,
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (newPassword !== confirmPassword) {
      setPwMsg({ text: "As senhas não conferem.", error: true });
      return;
    }
    if (newPassword.length < 6) {
      setPwMsg({ text: "Nova senha deve ter pelo menos 6 caracteres.", error: true });
      return;
    }
    setSavingPw(true);
    try {
      await api.post("/api/v1/auth/me/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPwMsg({ text: "Senha alterada com sucesso.", error: false });
    } catch (err) {
      setPwMsg({
        text: err instanceof ApiError ? err.detail : "Erro",
        error: true,
      });
    } finally {
      setSavingPw(false);
    }
  };

  if (!user) {
    return <div className="animate-pulse h-64 bg-muted rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meu perfil"
        description={user.email}
      />

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base">Dados de exibição</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveProfile} className="space-y-4">
            {profileMsg && (
              <div
                className={`rounded p-2 text-sm ${
                  profileMsg.error
                    ? "bg-red-50 text-red-600"
                    : "bg-green-50 text-green-700"
                }`}
              >
                {profileMsg.text}
              </div>
            )}
            <div className="space-y-1">
              <Label>Email</Label>
              <Input value={user.email} disabled />
            </div>
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Como aparece no sistema"
              />
            </div>
            <Button type="submit" disabled={savingProfile}>
              {savingProfile ? "Salvando..." : "Salvar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base">Trocar senha</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={changePassword} className="space-y-4">
            {pwMsg && (
              <div
                className={`rounded p-2 text-sm ${
                  pwMsg.error
                    ? "bg-red-50 text-red-600"
                    : "bg-green-50 text-green-700"
                }`}
              >
                {pwMsg.text}
              </div>
            )}
            <div className="space-y-1">
              <Label>Senha atual</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-1">
              <Label>Nova senha</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1">
              <Label>Confirmar nova senha</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" disabled={savingPw}>
              {savingPw ? "Trocando..." : "Trocar senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
