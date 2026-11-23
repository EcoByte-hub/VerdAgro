"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirPapel } from "@/lib/auth/sessao";
import {
  apagarArquivoEnviado,
  atualizarProjeto,
  definirPublicacao,
  marcarInteresseRecusado,
  obterProjetoDoProdutor,
  registrarDocumento,
  removerDocumento,
} from "@/lib/dados";
import { ROTULO_DOCUMENTO, TIPOS_DOCUMENTO } from "@/lib/dados/tipos";
import { PRATICAS } from "@/lib/diagnostico/schema";
import { caminhoValido } from "@/lib/documentos";
import { formatHectares } from "@/lib/utils";

/** `valores` devolve o que foi digitado, para o formulário não perder o texto quando há erro. */
export type EstadoEdicaoProjeto =
  { erro?: string; ok?: string; valores?: Record<string, string> } | undefined;
export type EstadoPublicacao = { erro?: string } | undefined;

const textoOpcional = (max: number, rotulo: string) =>
  z
    .string()
    .trim()
    .max(max, `${rotulo}: use no máximo ${max} caracteres`)
    .transform((v) => v || null);

const dataOpcional = z.union([z.literal(""), z.iso.date("Data inválida")]).transform((v) => v || null);

const schemaEdicao = z
  .object({
    projetoId: z.uuid(),
    titulo: z
      .string()
      .trim()
      .min(3, "Informe um título com pelo menos 3 caracteres")
      .max(120, "Título: use no máximo 120 caracteres"),
    descricao: textoOpcional(2000, "Descrição"),
    objetivo: textoOpcional(500, "Objetivo"),
    pratica: z.enum(PRATICAS, "Escolha a prática do projeto"),
    area: z.string().trim().min(1, "Informe a área do projeto"),
    metodologia: textoOpcional(120, "Metodologia"),
    inicio: dataOpcional,
    fim: dataOpcional,
    infoComercial: textoOpcional(1000, "Informações comerciais"),
  })
  .refine((d) => !d.inicio || !d.fim || d.fim >= d.inicio, "O término precisa ser depois do início");

/** Aceita "140", "140,5" e "1.234,5". */
function lerDecimal(texto: string) {
  const normalizado = texto.includes(",") ? texto.replace(/\./g, "").replace(",", ".") : texto;
  return Math.round(Number(normalizado) * 100) / 100;
}

/** Título, área e publicação aparecem no painel, na lista e no marketplace. */
function revalidarProjeto(id: string) {
  for (const caminho of [
    "/produtor",
    "/produtor/projetos",
    `/produtor/projetos/${id}`,
    "/marketplace",
    `/marketplace/${id}`,
  ]) {
    revalidatePath(caminho);
  }
}

export async function salvarProjeto(
  _: EstadoEdicaoProjeto,
  formData: FormData,
): Promise<EstadoEdicaoProjeto> {
  const sessao = await exigirPapel("produtor");

  const valores = Object.fromEntries(
    [...formData].filter((par): par is [string, string] => typeof par[1] === "string"),
  );
  const falha = (erro: string) => ({ erro, valores });

  const dados = schemaEdicao.safeParse(valores);
  if (!dados.success) return falha(dados.error.issues[0].message);

  const projeto = await obterProjetoDoProdutor(sessao, dados.data.projetoId);
  if (!projeto) return falha("Projeto não encontrado.");

  const areaHa = lerDecimal(dados.data.area);
  if (!Number.isFinite(areaHa) || areaHa <= 0) return falha("Informe uma área maior que zero");
  if (areaHa > projeto.propriedade.areaHa) {
    return falha(
      `A área do projeto não pode passar da área da propriedade (${formatHectares(projeto.propriedade.areaHa)}).`,
    );
  }

  if (sessao.modo === "demo") {
    return falha(
      "No modo demonstração as alterações não são salvas. Configure o Supabase para editar projetos.",
    );
  }

  try {
    await atualizarProjeto(sessao, projeto.id, {
      titulo: dados.data.titulo,
      descricao: dados.data.descricao,
      objetivo: dados.data.objetivo,
      pratica: dados.data.pratica,
      areaHa,
      metodologia: dados.data.metodologia,
      inicio: dados.data.inicio,
      fim: dados.data.fim,
      infoComercial: dados.data.infoComercial,
    });
  } catch (e) {
    console.error("[projeto] salvar", e);
    return falha("Não foi possível salvar agora. Tente novamente.");
  }

  revalidarProjeto(projeto.id);
  return { ok: "Alterações salvas." };
}

const schemaPublicacao = z.object({ projetoId: z.uuid(), publicar: z.enum(["sim", "nao"]) });

export async function alterarPublicacao(_: EstadoPublicacao, formData: FormData): Promise<EstadoPublicacao> {
  const sessao = await exigirPapel("produtor");
  const dados = schemaPublicacao.safeParse(Object.fromEntries(formData));
  if (!dados.success) return { erro: "Requisição inválida." };

  if (sessao.modo === "demo") {
    return {
      erro: "No modo demonstração a publicação não muda. Configure o Supabase para publicar projetos.",
    };
  }

  try {
    await definirPublicacao(sessao, dados.data.projetoId, dados.data.publicar === "sim");
  } catch (e) {
    console.error("[projeto] publicação", e);
    return { erro: "Não foi possível alterar a publicação agora. Tente novamente." };
  }

  revalidarProjeto(dados.data.projetoId);
  return undefined;
}

// ---------------------------------------------------------------------------
// Documentos. O arquivo vai do navegador direto para o Storage (até 10 MB não
// passaria pelo limite de 1 MB das server actions); aqui só se registra/remove.
// ---------------------------------------------------------------------------
export type EstadoDocumento = { erro?: string; ok?: string } | undefined;

const schemaDocumento = z
  .object({
    projetoId: z.uuid(),
    caminho: z.string(),
    nome: z.string().trim().min(1, "Arquivo sem nome").max(200, "Nome do arquivo muito longo"),
    tipo: z.enum(TIPOS_DOCUMENTO, "Escolha o tipo do documento"),
  })
  .refine((d) => caminhoValido(d.projetoId, d.caminho), "Arquivo inválido");

export async function anexarDocumento(dados: {
  projetoId: string;
  caminho: string;
  nome: string;
  tipo: string;
}): Promise<EstadoDocumento> {
  const sessao = await exigirPapel("produtor");
  const doc = schemaDocumento.safeParse(dados);
  if (!doc.success) return { erro: doc.error.issues[0].message };

  if (sessao.modo === "demo") {
    return { erro: "No modo demonstração os arquivos não são enviados." };
  }

  try {
    await registrarDocumento(sessao, doc.data);
  } catch (e) {
    console.error("[documentos] registrar", e);
    // Não deixa o arquivo sem registro no bucket
    await apagarArquivoEnviado(sessao, doc.data.caminho).catch(() => {});
    return { erro: "Não foi possível registrar o documento. Tente novamente." };
  }

  revalidarProjeto(doc.data.projetoId);
  return { ok: `${ROTULO_DOCUMENTO[doc.data.tipo]} anexado.` };
}

export async function excluirDocumento(documentoId: string): Promise<EstadoDocumento> {
  const sessao = await exigirPapel("produtor");
  if (!z.uuid().safeParse(documentoId).success) return { erro: "Documento inválido." };

  if (sessao.modo === "demo") {
    return { erro: "No modo demonstração os documentos não são removidos." };
  }

  try {
    const removido = await removerDocumento(sessao, documentoId);
    if (!removido) return { erro: "Documento não encontrado." };
    revalidarProjeto(removido.projetoId);
  } catch (e) {
    console.error("[documentos] remover", e);
    return { erro: "Não foi possível remover agora. Tente novamente." };
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Interesses recebidos
// ---------------------------------------------------------------------------
export async function recusarInteresse(interesseId: string): Promise<{ erro?: string } | undefined> {
  const sessao = await exigirPapel("produtor");
  if (!z.uuid().safeParse(interesseId).success) return { erro: "Interesse inválido." };

  if (sessao.modo === "demo") {
    return { erro: "No modo demonstração a recusa não é registrada. Configure o Supabase para responder." };
  }

  try {
    const recusado = await marcarInteresseRecusado(sessao, interesseId);
    if (!recusado) return { erro: "Este interesse não está mais em aberto. Atualize a página." };
    revalidarProjeto(recusado.projetoId);
    revalidatePath(`/negociacoes/${interesseId}`);
  } catch (e) {
    console.error("[interesses] recusar", e);
    return { erro: "Não foi possível recusar agora. Tente novamente." };
  }
  return undefined;
}
