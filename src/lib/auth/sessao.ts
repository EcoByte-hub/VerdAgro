import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { USUARIOS_DEMO } from "@/lib/demo/usuarios";
import { integrations } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { COOKIE_DEMO, HOME_DO_PAPEL, type Papel } from "./rotas";

export type Sessao = {
  modo: "supabase" | "demo";
  id: string;
  nome: string;
  organizacao: string | null;
  papel: Papel;
};

/** Usuário logado (ou null). Em modo demonstração, lê o papel escolhido no cookie. */
export async function obterSessao(): Promise<Sessao | null> {
  // A sessão é sempre por requisição (a SDK do Supabase usa Date.now() para o token)
  await connection();

  if (!integrations.supabase) {
    const papel = (await cookies()).get(COOKIE_DEMO)?.value as Papel | undefined;
    if (!papel || !(papel in USUARIOS_DEMO)) return null;
    const u = USUARIOS_DEMO[papel];
    return { modo: "demo", id: u.id, nome: u.nome, organizacao: u.organizacao, papel };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;

  const { data: perfil } = await supabase
    .from("profiles")
    .select("full_name, organization_name, role")
    .eq("id", userId)
    .single();
  if (!perfil) return null;

  return {
    modo: "supabase",
    id: userId,
    nome: perfil.full_name,
    organizacao: perfil.organization_name,
    papel: perfil.role,
  };
}

/** Exige login com um dos papéis; caso contrário redireciona. */
export async function exigirPapel(...papeis: Papel[]): Promise<Sessao> {
  const sessao = await obterSessao();
  if (!sessao) redirect("/entrar");
  if (!papeis.includes(sessao.papel)) redirect(HOME_DO_PAPEL[sessao.papel]);
  return sessao;
}
