import { z } from "zod";

/**
 * Saída estruturada do Diagnóstico Inteligente da Propriedade.
 *
 * GUARDA-CORPO: este schema NÃO possui campos de toneladas de CO₂, créditos,
 * receita ou certificação. O que não existe aqui não pode aparecer na tela.
 * Ver docs/adr/0005-ia-saida-estruturada.md.
 */

export const PRATICAS = [
  "plantio_direto",
  "rotacao_culturas",
  "recuperacao_pastagens",
  "culturas_cobertura",
  "integracao_lavoura_pecuaria",
  "manejo_solo",
  "outra",
] as const;

export const ROTULO_PRATICA: Record<(typeof PRATICAS)[number], string> = {
  plantio_direto: "Plantio direto",
  rotacao_culturas: "Rotação de culturas",
  recuperacao_pastagens: "Recuperação de pastagens",
  culturas_cobertura: "Culturas de cobertura",
  integracao_lavoura_pecuaria: "Integração lavoura-pecuária",
  manejo_solo: "Manejo do solo",
  outra: "Outra prática",
};

const nivel = z.enum(["alta", "media", "baixa"]);

export const diagnosticoSchema = z.object({
  resumo: z.string().describe("Resumo em 2 a 4 frases, em português simples, para o produtor rural."),
  leituraIndicadores: z
    .array(
      z.object({
        indicador: z.string().describe("Nome do indicador recebido, ex.: NDVI na estação seca"),
        leitura: z.string().describe("O que o valor sugere, sem inventar números novos"),
      }),
    )
    .describe("Interpretação dos indicadores calculados pela plataforma."),
  praticasIdentificadas: z
    .array(
      z.object({
        pratica: z.enum(PRATICAS),
        evidencia: z.string().describe("De onde vem a indicação: informado pelo produtor, satélite ou ambos"),
        confianca: nivel,
      }),
    )
    .describe("Práticas sustentáveis que parecem já existir na propriedade."),
  oportunidades: z
    .array(
      z.object({
        titulo: z.string(),
        pratica: z.enum(PRATICAS),
        descricao: z.string().describe("Por que faz sentido para esta propriedade e o que envolveria"),
        prioridade: nivel,
      }),
    )
    .describe("Práticas que poderiam ser adotadas ou ampliadas."),
  pontosAComprovar: z
    .array(z.string())
    .describe("Afirmações que dependem de comprovação documental ou de campo antes de qualquer projeto."),
  documentosNecessarios: z
    .array(
      z.object({
        documento: z.string(),
        motivo: z.string(),
      }),
    )
    .describe("Documentos e dados para estruturar um projeto de carbono."),
  proximasEtapas: z.array(z.string()).describe("Próximos passos em ordem, começando pelo mais simples."),
  alertas: z
    .array(z.string())
    .describe("Riscos ou impedimentos, ex.: pendências no CAR, dados de satélite insuficientes."),
});

export type Diagnostico = z.infer<typeof diagnosticoSchema>;

/** Texto fixo exibido junto de TODO diagnóstico. Não é gerado pela IA. */
export const AVISO_PRELIMINAR =
  "Diagnóstico preliminar. As recomendações não substituem estudos técnicos, metodologias reconhecidas ou certificação independente, e não representam créditos de carbono nem receita garantida.";
