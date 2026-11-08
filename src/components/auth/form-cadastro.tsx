"use client";

import { useActionState, useState } from "react";
import { Building2, Tractor } from "lucide-react";
import { cadastrar } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PAPEIS = [
  { valor: "produtor", rotulo: "Sou produtor rural", Icon: Tractor },
  { valor: "empresa", rotulo: "Sou empresa compradora", Icon: Building2 },
] as const;

export function FormCadastro() {
  const [estado, acao, pendente] = useActionState(cadastrar, undefined);
  const [papel, setPapel] = useState<"produtor" | "empresa">("produtor");

  return (
    <form action={acao} className="space-y-4">
      <fieldset className="grid grid-cols-2 gap-2">
        <legend className="mb-1.5 text-sm font-semibold text-tinta">Tipo de conta</legend>
        {PAPEIS.map(({ valor, rotulo, Icon }) => (
          <label
            key={valor}
            className={cn(
              "flex cursor-pointer flex-col gap-2 rounded-2xl border p-4 text-sm font-semibold transition-colors",
              papel === valor
                ? "border-mata-900 bg-mata-900 text-palha"
                : "border-areia bg-palha-50 text-tinta",
            )}
          >
            <input
              type="radio"
              name="papel"
              value={valor}
              checked={papel === valor}
              onChange={() => setPapel(valor)}
              className="sr-only"
            />
            <Icon size={20} className={papel === valor ? "text-broto" : "text-musgo"} />
            {rotulo}
          </label>
        ))}
      </fieldset>
      <div>
        <Label htmlFor="nome">Seu nome</Label>
        <Input id="nome" name="nome" autoComplete="name" required />
      </div>
      <div>
        <Label htmlFor="organizacao">{papel === "produtor" ? "Fazenda ou cooperativa" : "Empresa"}</Label>
        <Input id="organizacao" name="organizacao" autoComplete="organization" />
      </div>
      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <Label htmlFor="senha">Senha</Label>
        <Input id="senha" name="senha" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      <FieldError>{estado?.erro}</FieldError>
      <Button type="submit" size="lg" className="w-full" disabled={pendente}>
        {pendente ? "Criando conta..." : "Criar conta"}
      </Button>
    </form>
  );
}
