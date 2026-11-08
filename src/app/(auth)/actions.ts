"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { COOKIE_DEMO, HOME_DO_PAPEL, type Papel } from "@/lib/auth/rotas";
import { integrations } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type EstadoForm = { erro?: string; ok?: string } | undefined;

const entrarSchema = z.object({
  email: z.email("Informe um e-mail válido"),
  senha: z.string().min(6, "A senha tem pelo menos 6 caracteres"),
  voltar: z.string().optional(),
});

export async function entrar(_: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const dados = entrarSchema.safeParse(Object.fromEntries(formData));
  if (!dados.success) return { erro: dados.error.issues[0].message };
  if (!integrations.supabase) return { erro: "Supabase não configurado: use o acesso de demonstração." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: dados.data.email,
    password: dados.data.senha,
  });
  if (error) return { erro: "E-mail ou senha incorretos." };

  const voltar = dados.data.voltar;
  redirect(voltar?.startsWith("/") && !voltar.startsWith("//") ? voltar : "/inicio");
}

const cadastroSchema = z.object({
  nome: z.string().min(2, "Informe seu nome"),
  organizacao: z.string().optional(),
  email: z.email("Informe um e-mail válido"),
  senha: z.string().min(8, "Use pelo menos 8 caracteres"),
  papel: z.enum(["produtor", "empresa"], "Escolha o tipo de conta"),
});

export async function cadastrar(_: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const dados = cadastroSchema.safeParse(Object.fromEntries(formData));
  if (!dados.success) return { erro: dados.error.issues[0].message };
  if (!integrations.supabase) return { erro: "Supabase não configurado: use o acesso de demonstração." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: dados.data.email,
    password: dados.data.senha,
    options: {
      data: {
        role: dados.data.papel,
        full_name: dados.data.nome,
        organization_name: dados.data.organizacao ?? "",
      },
    },
  });
  if (error) return { erro: error.message };
  redirect("/inicio");
}

/** MODO DEMONSTRAÇÃO: entra com um usuário fictício sem Supabase. */
export async function entrarDemo(papel: Papel) {
  if (integrations.supabase) redirect("/entrar");
  (await cookies()).set(COOKIE_DEMO, papel, { httpOnly: true, sameSite: "lax", path: "/" });
  redirect(HOME_DO_PAPEL[papel]);
}

export async function sair() {
  if (integrations.supabase) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  (await cookies()).delete(COOKIE_DEMO);
  redirect("/entrar");
}
