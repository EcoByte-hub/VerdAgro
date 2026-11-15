import "server-only";

import type { Sessao } from "@/lib/auth/sessao";
import { INTERESSES_DEMO, PROJETOS_DEMO, PROPRIEDADES_DEMO } from "@/lib/demo/catalogo";
import { USUARIOS_DEMO } from "@/lib/demo/usuarios";
import { createClient } from "@/lib/supabase/server";
import type { IndicadoresAdmin } from "./tipos";

/** Consulta sem cache compartilhado: os totais refletem cada acesso ao painel. */
export async function obterIndicadoresAdmin(sessao: Sessao): Promise<IndicadoresAdmin> {
  if (sessao.papel !== "admin") throw new Error("Acesso restrito à administração.");

  if (sessao.modo === "demo") {
    return {
      produtores: new Set([
        USUARIOS_DEMO.produtor.id,
        ...PROPRIEDADES_DEMO.map((p) => p.donoId),
        ...PROJETOS_DEMO.map((p) => p.donoId),
      ]).size,
      propriedades: PROPRIEDADES_DEMO.length,
      hectares: PROPRIEDADES_DEMO.reduce((total, p) => total + p.areaHa, 0),
      projetos: PROJETOS_DEMO.length,
      empresas: new Set([USUARIOS_DEMO.empresa.id, ...INTERESSES_DEMO.map((i) => i.empresaId)]).size,
      interesses: INTERESSES_DEMO.length,
      projetosEmValidacao: PROJETOS_DEMO.filter((p) => p.estagio === "validacao").length,
      creditosEmitidos: PROJETOS_DEMO.filter((p) =>
        ["emissao_creditos", "comercializacao"].includes(p.estagio),
      ).reduce((total, p) => total + (p.creditosEmitidos ?? 0), 0),
      propriedadesDemo: PROPRIEDADES_DEMO.filter((p) => p.isDemo).length,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("indicadores_admin").single();
  if (error) throw error;
  if (!data) throw new Error("Indicadores indisponíveis.");

  return {
    produtores: Number(data.producers),
    propriedades: Number(data.properties),
    hectares: Number(data.hectares),
    projetos: Number(data.projects),
    empresas: Number(data.companies),
    interesses: Number(data.interests),
    projetosEmValidacao: Number(data.projects_in_validation),
    creditosEmitidos: Number(data.issued_credits),
    propriedadesDemo: Number(data.demo_properties),
  };
}
