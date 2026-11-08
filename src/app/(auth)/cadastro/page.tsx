import type { Metadata } from "next";
import Link from "next/link";
import { AcessoDemo } from "@/components/auth/acesso-demo";
import { FormCadastro } from "@/components/auth/form-cadastro";
import { integrations } from "@/lib/env";

export const metadata: Metadata = { title: "Criar conta" };

export default function CadastroPage() {
  return (
    <>
      <p className="eyebrow text-musgo">Comece agora</p>
      <h1 className="mt-3 font-display-soft text-4xl text-mata-900">Criar conta</h1>
      <div className="mt-8 space-y-6">
        {integrations.supabase ? <FormCadastro /> : <AcessoDemo />}
        <p className="text-sm text-tinta-soft">
          Já tem conta?{" "}
          <Link href="/entrar" className="font-semibold text-musgo underline-offset-4 hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </>
  );
}
