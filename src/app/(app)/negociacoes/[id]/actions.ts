"use server";

import { revalidatePath } from "next/cache";
import { exigirPapel } from "@/lib/auth/sessao";
import { enviarMensagemNegociacao, responderNegociacao } from "@/lib/dados/negociacoes";
import { schemaMensagemNegociacao, schemaRespostaNegociacao } from "@/lib/negociacoes";

export type EstadoNegociacao = { erro?: string; ok?: string } | undefined;

function revalidarNegociacao(interesseId: string, projetoId: string) {
  revalidatePath(`/negociacoes/${interesseId}`);
  revalidatePath("/produtor");
  revalidatePath(`/produtor/projetos/${projetoId}`);
  revalidatePath("/empresa");
  revalidatePath(`/marketplace/${projetoId}`);
}

export async function enviarMensagem(_: EstadoNegociacao, formData: FormData): Promise<EstadoNegociacao> {
  const sessao = await exigirPapel("produtor", "empresa");
  const dados = schemaMensagemNegociacao.safeParse(Object.fromEntries(formData));
  if (!dados.success) return { erro: dados.error.issues[0].message };
  if (sessao.modo === "demo") {
    return { erro: "No modo demonstração as mensagens não são enviadas." };
  }

  try {
    const enviada = await enviarMensagemNegociacao(sessao, dados.data.interesseId, dados.data.corpo);
    if (!enviada) return { erro: "Negociação indisponível. Atualize a página." };
    revalidarNegociacao(dados.data.interesseId, enviada.projetoId);
  } catch (erro) {
    console.error("[negociacoes] enviar mensagem", erro);
    return { erro: "Não foi possível enviar a mensagem agora. Tente novamente." };
  }
  return { ok: "Mensagem enviada." };
}

export async function responderInteresse(_: EstadoNegociacao, formData: FormData): Promise<EstadoNegociacao> {
  const sessao = await exigirPapel("produtor");
  const dados = schemaRespostaNegociacao.safeParse(Object.fromEntries(formData));
  if (!dados.success) return { erro: dados.error.issues[0].message };
  if (sessao.modo === "demo") {
    return { erro: "No modo demonstração as respostas não são registradas." };
  }

  try {
    const resposta = await responderNegociacao(sessao, dados.data.interesseId, dados.data.status);
    if (!resposta) return { erro: "Este interesse não está mais em aberto. Atualize a página." };
    revalidarNegociacao(dados.data.interesseId, resposta.projetoId);
  } catch (erro) {
    console.error("[negociacoes] responder interesse", erro);
    return { erro: "Não foi possível registrar a resposta agora. Tente novamente." };
  }
  return { ok: "Resposta registrada." };
}
