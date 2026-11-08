"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { entrar } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";

export function FormEntrar() {
  const [estado, acao, pendente] = useActionState(entrar, undefined);
  const voltar = useSearchParams().get("voltar") ?? "";

  return (
    <form action={acao} className="space-y-4">
      <input type="hidden" name="voltar" value={voltar} />
      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <Label htmlFor="senha">Senha</Label>
        <Input id="senha" name="senha" type="password" autoComplete="current-password" required />
      </div>
      <FieldError>{estado?.erro}</FieldError>
      <Button type="submit" size="lg" className="w-full" disabled={pendente}>
        {pendente ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
