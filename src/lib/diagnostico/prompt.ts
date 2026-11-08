import { ROTULO_PRATICA } from "./schema";
import type { Indicadores } from "./indicadores";

export type DadosPropriedade = {
  nome: string;
  municipio: string;
  uf: string;
  areaHa: number;
  producao?: string | null;
  culturas: readonly string[];
  historico?: string | null;
  praticas: readonly { pratica: keyof typeof ROTULO_PRATICA; desde?: number | null }[];
};

/**
 * Instruções fixas (cacheáveis). Os guarda-corpos do documento de concepção
 * estão aqui E no schema; o schema é a barreira final.
 */
export const SYSTEM_PROMPT = `Você é o módulo de inteligência ambiental do VerdAgro, uma plataforma que ajuda pequenos e médios produtores rurais brasileiros a entender o potencial ambiental da propriedade e a estruturar projetos que, no futuro, poderão passar por certificação independente no mercado de carbono.

Você recebe dados informados pelo produtor e indicadores já calculados pela plataforma (NDVI do Sentinel-2 e clima da NASA POWER). Sua tarefa é interpretar esses dados e orientar o produtor.

Regras obrigatórias:
- Não estime toneladas de CO₂, créditos de carbono, receita ou valores em dinheiro. A plataforma não calcula isso nesta etapa e o produtor não pode ser induzido a esperar um valor.
- Não diga que a propriedade, a prática ou um projeto é certificado, elegível ou aprovado. Use linguagem condicional ("pode", "indica", "vale verificar").
- Não invente números. Cite apenas os indicadores recebidos; se um dado faltar, diga que falta.
- Diferencie o que foi informado pelo produtor do que o satélite sugere. Tudo que dependa de prova vai para "pontosAComprovar".
- Considere princípios de projetos de carbono no agro: adicionalidade, linha de base, permanência e vazamento. Explique-os em linguagem simples quando forem relevantes.
- Metodologias de referência: Verra VM0042 (manejo agrícola aprimorado). Mencione como referência, nunca como garantia.
- Escreva em português do Brasil, frases curtas, sem jargão desnecessário. O leitor é um produtor rural.`;

const fmt = (v: number | null, sufixo = "") =>
  v === null ? "sem dado" : `${String(v).replace(".", ",")}${sufixo}`;

/** Monta a mensagem do usuário com os dados da propriedade e os indicadores. */
export function montarMensagem(
  p: DadosPropriedade,
  ind: Indicadores,
  origemNdvi: "sentinel-2" | "demo",
): string {
  const praticas = p.praticas.length
    ? p.praticas
        .map((x) => `- ${ROTULO_PRATICA[x.pratica]}${x.desde ? ` (desde ${x.desde})` : ""}`)
        .join("\n")
    : "- Nenhuma prática informada";

  return `## Propriedade (informado pelo produtor)
- Nome: ${p.nome}
- Localização: ${p.municipio}/${p.uf}
- Área: ${fmt(p.areaHa, " ha")}
- Tipo de produção: ${p.producao ?? "não informado"}
- Culturas: ${p.culturas.length ? p.culturas.join(", ") : "não informado"}
- Histórico de uso do solo: ${p.historico ?? "não informado"}

## Práticas de manejo informadas
${praticas}

## Indicadores calculados pela plataforma (últimos 12 meses)
Origem do NDVI: ${origemNdvi === "sentinel-2" ? "Sentinel-2 (satélite)" : "série demonstrativa"}
- NDVI médio: ${fmt(ind.ndviMedio)}
- NDVI de pico: ${fmt(ind.ndviPico)}
- NDVI médio na estação seca (jun–set): ${fmt(ind.ndviSeca)}
- Meses com vegetação ativa (NDVI ≥ 0,5): ${ind.mesesVegetacaoAtiva} de ${ind.mesesComDado}
- Meses com sinal de solo exposto (NDVI < 0,3): ${ind.mesesSoloExposto} de ${ind.mesesComDado}
- Precipitação anual: ${fmt(ind.precipitacaoAnualMm, " mm")}
- Temperatura média: ${fmt(ind.temperaturaMediaC, " °C")}
- Meses secos (< 50 mm): ${ind.mesesSecos ?? "sem dado"}

Gere o diagnóstico inicial desta propriedade.`;
}
