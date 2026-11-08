import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AcessoDemo } from "@/components/auth/acesso-demo";
import { FormEntrar } from "@/components/auth/form-entrar";
import { integrations } from "@/lib/env";

export const metadata: Metadata = { title: "Entrar" };

export default function EntrarPage() {
  const demo = !integrations.supabase;

  return (
    <>
      <p className="eyebrow text-musgo">Bem-vindo de volta</p>
      <h1 className="mt-3 font-display-soft text-4xl text-mata-900">Entrar no VerdAgro</h1>

      {demo ? (
        <div className="mt-8 space-y-4">
          <AcessoDemo />
          <p className="text-xs text-tinta-soft">
            Supabase não configurado: o app está em modo demonstração. Veja o README para conectar o banco.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          <Suspense>
            <FormEntrar />
          </Suspense>
          <p className="text-sm text-tinta-soft">
            Ainda não tem conta?{" "}
            <Link href="/cadastro" className="font-semibold text-musgo underline-offset-4 hover:underline">
              Cadastre-se
            </Link>
          </p>
          <p className="rounded-xl bg-areia/60 p-3 text-xs text-tinta-soft">
            Usuários de demonstração do seed: <code>produtor@demo.verdagro.app</code>,{" "}
            <code>empresa@demo.verdagro.app</code> · senha <code>verdagro-demo</code>
          </p>
        </div>
      )}
    </>
  );
}
