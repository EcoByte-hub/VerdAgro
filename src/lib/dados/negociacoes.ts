import "server-only";

import type { Sessao } from "@/lib/auth/sessao";
import { INTERESSES_DEMO } from "@/lib/demo/catalogo";
import { USUARIOS_DEMO } from "@/lib/demo/usuarios";
import { podeResponderNegociacao, type StatusRespostaNegociacao } from "@/lib/negociacoes";
import { createClient } from "@/lib/supabase/server";
import type { Negociacao } from "./tipos";

type Cliente = Awaited<ReturnType<typeof createClient>>;

async function buscarInteresse(supabase: Cliente, id: string) {
  const { data, error } = await supabase
    .from("interests")
    .select(
      "id, project_id, company_id, status, message, proposed_volume, created_at, projects(title, owner_id)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

function participa(sessao: Sessao, interesse: { company_id: string; projects: { owner_id: string } | null }) {
  return (
    (sessao.papel === "empresa" && interesse.company_id === sessao.id) ||
    (sessao.papel === "produtor" && interesse.projects?.owner_id === sessao.id)
  );
}

export async function obterNegociacao(sessao: Sessao, id: string): Promise<Negociacao | null> {
  if (sessao.papel !== "empresa" && sessao.papel !== "produtor") return null;
  if (sessao.modo === "demo") {
    const interesse = INTERESSES_DEMO.find(
      (i) =>
        i.id === id &&
        (sessao.papel === "empresa" ? i.empresaId === sessao.id : i.donoProjetoId === sessao.id),
    );
    if (!interesse) return null;
    return {
      ...interesse,
      contraparte: sessao.papel === "empresa" ? USUARIOS_DEMO.produtor.organizacao : interesse.contraparte,
      // Ainda sem resposta: a mensagem inicial aparece separada da conversa.
      mensagens: [],
    };
  }

  const supabase = await createClient();
  const interesse = await buscarInteresse(supabase, id);
  if (!interesse || !participa(sessao, interesse)) return null;

  const contraparteId = sessao.papel === "empresa" ? interesse.projects?.owner_id : interesse.company_id;
  const [{ data: mensagens, error: erroMensagens }, perfil] = await Promise.all([
    supabase
      .from("interest_messages")
      .select("id, author_id, body, created_at")
      .eq("interest_id", id)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true }),
    contraparteId
      ? supabase.from("profiles").select("full_name, organization_name").eq("id", contraparteId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (erroMensagens) throw erroMensagens;
  if (perfil.error) throw perfil.error;

  return {
    id: interesse.id,
    projetoId: interesse.project_id,
    projetoTitulo: interesse.projects?.title ?? "Projeto",
    status: interesse.status,
    mensagem: interesse.message,
    volumeProposto: interesse.proposed_volume === null ? null : Number(interesse.proposed_volume),
    contraparte: perfil.data ? (perfil.data.organization_name ?? perfil.data.full_name) : null,
    criadoEm: interesse.created_at,
    empresaId: interesse.company_id,
    donoProjetoId: interesse.projects?.owner_id ?? "",
    mensagens: (mensagens ?? []).map((m) => ({
      id: m.id,
      autorId: m.author_id,
      corpo: m.body,
      criadoEm: m.created_at,
    })),
  };
}

export async function responderNegociacao(
  sessao: Sessao,
  id: string,
  status: StatusRespostaNegociacao,
): Promise<{ projetoId: string } | null> {
  if (sessao.papel !== "produtor") return null;
  if (sessao.modo === "demo") {
    throw new Error("No modo demonstração as respostas não são registradas.");
  }
  const supabase = await createClient();
  const interesse = await buscarInteresse(supabase, id);
  if (!interesse || interesse.projects?.owner_id !== sessao.id) return null;
  if (!podeResponderNegociacao(interesse.status, status)) return null;

  const { data, error } = await supabase
    .from("interests")
    .update({ status })
    .eq("id", id)
    .eq("project_id", interesse.project_id)
    .eq("status", interesse.status)
    .select("project_id")
    .maybeSingle();
  if (error) throw error;
  return data && { projetoId: data.project_id };
}

export async function enviarMensagemNegociacao(
  sessao: Sessao,
  id: string,
  corpo: string,
): Promise<{ projetoId: string } | null> {
  if (sessao.papel !== "empresa" && sessao.papel !== "produtor") return null;
  if (sessao.modo === "demo") {
    throw new Error("No modo demonstração as mensagens não são enviadas.");
  }
  const supabase = await createClient();
  const interesse = await buscarInteresse(supabase, id);
  if (!interesse || !participa(sessao, interesse)) return null;

  const { error } = await supabase.from("interest_messages").insert({
    interest_id: id,
    author_id: sessao.id,
    body: corpo,
  });
  if (error) throw error;
  return { projetoId: interesse.project_id };
}
