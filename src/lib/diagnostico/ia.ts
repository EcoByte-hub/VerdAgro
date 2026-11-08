import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { diagnosticoSchema, type Diagnostico } from "./schema";
import { SYSTEM_PROMPT } from "./prompt";

export class DiagnosticoRecusadoError extends Error {}

/**
 * Uma única chamada ao Claude com saída estruturada (validada pelo schema Zod).
 * - fallbacks "default": se o modelo recusar por política, a API tenta outro modelo.
 * - effort "medium": tarefa de interpretação, não precisa do nível máximo.
 */
export async function gerarDiagnosticoComIA(
  mensagem: string,
  { apiKey, model }: { apiKey: string; model: string },
): Promise<{ diagnostico: Diagnostico; modelo: string }> {
  const client = new Anthropic({ apiKey, timeout: 90_000, maxRetries: 1 });

  const response = await client.beta.messages.parse({
    model,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: {
      effort: "medium",
      format: betaZodOutputFormat(diagnosticoSchema),
    },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: mensagem }],
  });

  if (response.stop_reason === "refusal") {
    throw new DiagnosticoRecusadoError("O modelo recusou gerar o diagnóstico");
  }
  if (!response.parsed_output) {
    throw new Error(`Diagnóstico sem saída estruturada (stop_reason: ${response.stop_reason})`);
  }

  return { diagnostico: response.parsed_output, modelo: response.model };
}
