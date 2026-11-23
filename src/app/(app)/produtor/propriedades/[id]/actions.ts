"use server";

import { revalidatePath } from "next/cache";
import { exigirPapel } from "@/lib/auth/sessao";
import { obterPropriedade, salvarDiagnostico } from "@/lib/dados";
import { gerarDiagnostico, type ResultadoDiagnostico } from "@/lib/diagnostico/gerar";

export type RespostaDiagnostico =
  { ok: true; resultado: ResultadoDiagnostico; criadoEm: string | null } | { ok: false; erro: string };

/** Gera (e salva) o Diagnóstico Inteligente de uma propriedade do produtor logado. */
export async function executarDiagnostico(propriedadeId: string): Promise<RespostaDiagnostico> {
  const sessao = await exigirPapel("produtor");
  const propriedade = await obterPropriedade(sessao, propriedadeId);
  if (!propriedade) return { ok: false, erro: "Propriedade não encontrada." };

  try {
    const resultado = await gerarDiagnostico(propriedade);
    if (resultado.falhas.length) console.warn("[diagnóstico] integrações em modo demo:", resultado.falhas);

    const criadoEm = await salvarDiagnostico(sessao, propriedade.id, {
      ndvi: resultado.ndvi,
      clima: resultado.clima,
      resultado: resultado.diagnostico,
      origem: resultado.origem,
      modelo: resultado.modelo,
    });
    revalidatePath(`/produtor/propriedades/${propriedade.id}`);
    return { ok: true, resultado, criadoEm };
  } catch (e) {
    console.error("[diagnóstico]", e);
    return { ok: false, erro: "Não foi possível gerar o diagnóstico agora. Tente novamente." };
  }
}
