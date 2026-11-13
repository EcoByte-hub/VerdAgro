import "server-only";

import type { Sessao } from "@/lib/auth/sessao";
import { INTERESSES_DEMO, PROJETOS_DEMO, PROPRIEDADES_DEMO } from "@/lib/demo/catalogo";
import type { PoligonoGeoJSON } from "@/lib/geo/poligono";
import { createClient } from "@/lib/supabase/server";
import type {
  Estagio,
  FiltrosMarketplace,
  Interesse,
  Pratica,
  ProjetoDetalhe,
  ProjetoDoProdutor,
  ProjetoResumo,
  Propriedade,
} from "./tipos";

/**
 * Camada de acesso a dados. Cada função tem dois caminhos:
 * - sessão "supabase": consulta o banco (RLS garante as permissões);
 * - sessão "demo": usa o catálogo demonstrativo em memória.
 * As páginas nunca falam com o Supabase diretamente.
 */

// ---------------------------------------------------------------------------
// Propriedades
// ---------------------------------------------------------------------------
export async function listarPropriedades(sessao: Sessao): Promise<Propriedade[]> {
  if (sessao.modo === "demo") return PROPRIEDADES_DEMO.filter((p) => p.donoId === sessao.id);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("propriedades_app")
    .select("*")
    .eq("owner_id", sessao.id)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const ids = data.map((p) => p.id!);
  const { data: praticas } = ids.length
    ? await supabase
        .from("property_practices")
        .select("property_id, practice, since_year")
        .in("property_id", ids)
    : { data: [] };

  return data.map((p) => ({
    id: p.id!,
    nome: p.name!,
    municipio: p.city!,
    uf: p.state!,
    areaHa: Number(p.area_ha),
    producao: p.production_type,
    culturas: p.crops ?? [],
    historico: p.land_use_history,
    isDemo: Boolean(p.is_demo),
    poligono: p.poligono as unknown as PoligonoGeoJSON,
    praticas: (praticas ?? [])
      .filter((x) => x.property_id === p.id)
      .map((x) => ({ pratica: x.practice, desde: x.since_year })),
  }));
}

export async function obterPropriedade(sessao: Sessao, id: string): Promise<Propriedade | null> {
  const todas = await listarPropriedades(sessao);
  return todas.find((p) => p.id === id) ?? null;
}

export type NovaPropriedade = {
  nome: string;
  municipio: string;
  uf: string;
  producao: string | null;
  culturas: string[];
  historico: string | null;
  poligonoWKT: string;
  praticas: { pratica: Pratica; desde: number | null }[];
};

export async function criarPropriedade(sessao: Sessao, nova: NovaPropriedade): Promise<string> {
  if (sessao.modo === "demo") return PROPRIEDADES_DEMO[0].id; // demo é somente leitura

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .insert({
      owner_id: sessao.id,
      name: nova.nome,
      city: nova.municipio,
      state: nova.uf,
      production_type: nova.producao,
      crops: nova.culturas,
      land_use_history: nova.historico,
      boundary: nova.poligonoWKT,
    })
    .select("id")
    .single();
  if (error) throw error;

  if (nova.praticas.length) {
    const { error: erroPraticas } = await supabase
      .from("property_practices")
      .insert(nova.praticas.map((p) => ({ property_id: data.id, practice: p.pratica, since_year: p.desde })));
    if (erroPraticas) throw erroPraticas;
  }
  return data.id;
}

// ---------------------------------------------------------------------------
// Diagnósticos
// ---------------------------------------------------------------------------
export async function salvarDiagnostico(
  sessao: Sessao,
  propriedadeId: string,
  registro: { ndvi: unknown; clima: unknown; resultado: unknown; origem: unknown; modelo: string | null },
) {
  if (sessao.modo === "demo") return;
  const supabase = await createClient();
  const { error } = await supabase.from("diagnostics").insert({
    property_id: propriedadeId,
    ndvi: registro.ndvi as never,
    climate: registro.clima as never,
    result: registro.resultado as never,
    sources: registro.origem as never,
    model: registro.modelo,
  });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Projetos e marketplace
// ---------------------------------------------------------------------------
type LinhaMarketplace = {
  id: string | null;
  title: string | null;
  description: string | null;
  practice: Pratica | null;
  area_ha: number | null;
  methodology: string | null;
  current_stage: Estagio | null;
  issued_credits: number | null;
  commercial_info: string | null;
  city: string | null;
  state: string | null;
  crops: string[] | null;
  is_demo: boolean | null;
};

const daLinha = (r: LinhaMarketplace): ProjetoResumo => ({
  id: r.id!,
  titulo: r.title!,
  descricao: r.description,
  pratica: r.practice!,
  areaHa: Number(r.area_ha),
  metodologia: r.methodology,
  estagio: r.current_stage!,
  creditosEmitidos: r.issued_credits === null ? null : Number(r.issued_credits),
  municipio: r.city!,
  uf: r.state!,
  culturas: r.crops ?? [],
  isDemo: Boolean(r.is_demo),
  publicado: true,
  infoComercial: r.commercial_info,
});

export async function listarMarketplace(
  sessao: Sessao,
  filtros: FiltrosMarketplace = {},
): Promise<ProjetoResumo[]> {
  const busca = filtros.busca?.trim().toLowerCase();

  if (sessao.modo === "demo") {
    return PROJETOS_DEMO.filter(
      (p) =>
        p.publicado &&
        (!filtros.uf || p.uf === filtros.uf) &&
        (!filtros.pratica || p.pratica === filtros.pratica) &&
        (!busca || `${p.titulo} ${p.municipio} ${p.culturas.join(" ")}`.toLowerCase().includes(busca)),
    );
  }

  const supabase = await createClient();
  let query = supabase.from("marketplace_projects").select("*").order("created_at", { ascending: false });
  if (filtros.uf) query = query.eq("state", filtros.uf);
  if (filtros.pratica) query = query.eq("practice", filtros.pratica);
  if (busca)
    query = query.or(
      `title.ilike.%${busca.replace(/[,()%]/g, "")}%,city.ilike.%${busca.replace(/[,()%]/g, "")}%`,
    );
  const { data, error } = await query;
  if (error) throw error;
  return data.map(daLinha);
}

export async function listarProjetosDoProdutor(sessao: Sessao): Promise<ProjetoResumo[]> {
  if (sessao.modo === "demo") return PROJETOS_DEMO.filter((p) => p.donoId === sessao.id);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*, properties(city, state, crops, is_demo)")
    .eq("owner_id", sessao.id)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return data.map((p) => ({
    ...daLinha({
      ...p,
      current_stage: p.current_stage,
      city: p.properties?.city ?? null,
      state: p.properties?.state ?? null,
      crops: p.properties?.crops ?? null,
      is_demo: p.properties?.is_demo ?? null,
    }),
    publicado: p.is_published,
  }));
}

export async function obterProjeto(sessao: Sessao, id: string): Promise<ProjetoDetalhe | null> {
  if (sessao.modo === "demo") {
    const p = PROJETOS_DEMO.find((x) => x.id === id && (x.publicado || x.donoId === sessao.id));
    return p ?? null;
  }

  const supabase = await createClient();
  const [{ data: linha }, { data: projeto }, { data: eventos }] = await Promise.all([
    supabase.from("marketplace_projects").select("*").eq("id", id).maybeSingle(),
    supabase.from("projects").select("objective, start_date, is_published").eq("id", id).maybeSingle(),
    supabase
      .from("project_stage_events")
      .select("stage, note, created_at")
      .eq("project_id", id)
      .order("created_at"),
  ]);
  if (!linha || !projeto) return null;

  return {
    ...daLinha(linha),
    publicado: projeto.is_published,
    objetivo: projeto.objective,
    inicio: projeto.start_date,
    linhaDoTempo: (eventos ?? []).map((e) => ({ estagio: e.stage, nota: e.note, data: e.created_at })),
  };
}

/**
 * Projeto na visão do dono. Lê direto de `projects` (e não da view do marketplace)
 * para enxergar também os projetos não publicados.
 */
export async function obterProjetoDoProdutor(sessao: Sessao, id: string): Promise<ProjetoDoProdutor | null> {
  if (sessao.modo === "demo") {
    const p = PROJETOS_DEMO.find((x) => x.id === id && x.donoId === sessao.id);
    const propriedade = PROPRIEDADES_DEMO.find((x) => x.id === p?.propriedadeId);
    if (!p || !propriedade) return null;
    return {
      ...p,
      fim: null,
      propriedade: { id: propriedade.id, nome: propriedade.nome, areaHa: propriedade.areaHa },
      documentos: [],
    };
  }

  const supabase = await createClient();
  const [{ data: p }, { data: eventos }, { data: docs }] = await Promise.all([
    supabase
      .from("projects")
      .select("*, properties(id, name, city, state, crops, area_ha, is_demo)")
      .eq("id", id)
      .eq("owner_id", sessao.id)
      .maybeSingle(),
    supabase
      .from("project_stage_events")
      .select("stage, note, created_at")
      .eq("project_id", id)
      .order("created_at"),
    supabase
      .from("project_documents")
      .select("id, storage_path, file_name, kind, created_at")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
  ]);
  if (!p || !p.properties) return null;

  // Bucket privado: gera links temporários (1 h) para o dono abrir os arquivos
  const caminhos = (docs ?? []).map((d) => d.storage_path);
  const { data: assinadas } = caminhos.length
    ? await supabase.storage.from("evidencias").createSignedUrls(caminhos, 3600)
    : { data: [] };

  return {
    ...daLinha({
      ...p,
      city: p.properties.city,
      state: p.properties.state,
      crops: p.properties.crops,
      is_demo: p.properties.is_demo,
    }),
    publicado: p.is_published,
    objetivo: p.objective,
    inicio: p.start_date,
    fim: p.end_date,
    linhaDoTempo: (eventos ?? []).map((e) => ({ estagio: e.stage, nota: e.note, data: e.created_at })),
    propriedade: {
      id: p.properties.id,
      nome: p.properties.name,
      areaHa: Number(p.properties.area_ha),
    },
    documentos: (docs ?? []).map((d) => ({
      id: d.id,
      nome: d.file_name,
      tipo: d.kind,
      criadoEm: d.created_at,
      url: assinadas?.find((a) => a.path === d.storage_path)?.signedUrl ?? null,
    })),
  };
}

// ---------------------------------------------------------------------------
// Interesses (negociação)
// ---------------------------------------------------------------------------
export async function listarInteresses(sessao: Sessao): Promise<Interesse[]> {
  if (sessao.modo === "demo") {
    return INTERESSES_DEMO.filter((i) =>
      sessao.papel === "empresa" ? i.empresaId === sessao.id : i.donoProjetoId === sessao.id,
    ).map((i) => ({
      ...i,
      contraparte: sessao.papel === "empresa" ? "Fazenda Boa Vista" : i.contraparte,
    }));
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("interests")
    .select(
      "id, project_id, status, message, proposed_volume, created_at, company_id, projects(title, owner_id)",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;

  // Nome da contraparte (RLS libera o perfil de quem participa da negociação)
  const outros = data.map((i) => (sessao.papel === "empresa" ? i.projects?.owner_id : i.company_id));
  const { data: perfis } = await supabase
    .from("profiles")
    .select("id, full_name, organization_name")
    .in("id", outros.filter(Boolean) as string[]);

  return data.map((i, idx) => {
    const perfil = perfis?.find((p) => p.id === outros[idx]);
    return {
      id: i.id,
      projetoId: i.project_id,
      projetoTitulo: i.projects?.title ?? "Projeto",
      status: i.status,
      mensagem: i.message,
      volumeProposto: i.proposed_volume === null ? null : Number(i.proposed_volume),
      contraparte: perfil ? (perfil.organization_name ?? perfil.full_name) : null,
      criadoEm: i.created_at,
    };
  });
}

export async function criarInteresse(
  sessao: Sessao,
  dados: { projetoId: string; mensagem: string; volumeProposto: number | null },
) {
  if (sessao.modo === "demo") return;
  const supabase = await createClient();
  const { error } = await supabase.from("interests").insert({
    project_id: dados.projetoId,
    company_id: sessao.id,
    message: dados.mensagem,
    proposed_volume: dados.volumeProposto,
  });
  if (error) {
    if (error.code === "23505") throw new Error("Você já manifestou interesse neste projeto.");
    throw error;
  }
}
