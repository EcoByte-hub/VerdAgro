import { z } from "zod";
import type { StatusInteresse } from "@/lib/dados/tipos";

export const schemaMensagemNegociacao = z.object({
  interesseId: z.uuid("Negociação inválida."),
  corpo: z
    .string()
    .trim()
    .min(1, "Escreva uma mensagem.")
    .max(4000, "A mensagem deve ter no máximo 4.000 caracteres."),
});

export const schemaRespostaNegociacao = z.object({
  interesseId: z.uuid("Negociação inválida."),
  status: z.enum(["em_negociacao", "aceita", "recusada"], "Escolha uma resposta válida."),
});

export type StatusRespostaNegociacao = z.infer<typeof schemaRespostaNegociacao>["status"];

/** O produtor responde uma vez; enquanto negocia, ainda pode aceitar ou recusar. */
export function podeResponderNegociacao(atual: StatusInteresse, resposta: StatusRespostaNegociacao) {
  return atual === "enviada" || (atual === "em_negociacao" && resposta !== "em_negociacao");
}
