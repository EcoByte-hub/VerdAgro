"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { exigirPapel } from "@/lib/auth/sessao";
import { criarProjeto, obterPropriedade } from "@/lib/dados";
import { PRATICAS } from "@/lib/diagnostico/schema";
import { formatHectares } from "@/lib/utils";

/** `valores` devolve o que foi digitado, para o formulário não perder o texto quando há erro. */
export type EstadoNovoProjeto = { erro?: string; valores?: Record<string, string> } | undefined;

const textoOpcional = (max: number, rotulo: string) =>
  z
    .string()
    .trim()
    .max(max, `${rotulo}: use no máximo ${max} caracteres`)
    .transform((v) => v || null);

const dataOpcional = z.union([z.literal(""), z.iso.date("Data inválida")]).transform((v) => v || null);

const schema = z
  .object({
    propriedade: z.uuid("Escolha a propriedade do projeto"),
    titulo: z
      .string()
      .trim()
      .min(3, "Informe um título com pelo menos 3 caracteres")
      .max(120, "Título: use no máximo 120 caracteres"),
    descricao: textoOpcional(2000, "Descrição"),
    pratica: z.enum(PRATICAS, "Escolha a prática do projeto"),
    area: z.string().trim().min(1, "Informe a área do projeto"),
    objetivo: textoOpcional(500, "Objetivo"),
    metodologia: textoOpcional(120, "Metodologia"),
    inicio: dataOpcional,
    fim: dataOpcional,
    infoComercial: textoOpcional(1000, "Informações comerciais"),
    publicar: z.union([z.literal(""), z.literal("on")]).optional(),
  })
  .refine((d) => !d.inicio || !d.fim || d.fim >= d.inicio, "O término precisa ser depois do início");

/** Aceita "140", "140,5" e "1.234,5". */
function lerDecimal(texto: string) {
  const normalizado = texto.includes(",") ? texto.replace(/\./g, "").replace(",", ".") : texto;
  return Math.round(Number(normalizado) * 100) / 100;
}

export async function criarProjetoAction(
  _: EstadoNovoProjeto,
  formData: FormData,
): Promise<EstadoNovoProjeto> {
  const sessao = await exigirPapel("produtor");

  const valores = Object.fromEntries(
    [...formData].filter((par): par is [string, string] => typeof par[1] === "string"),
  );
  const falha = (erro: string) => ({ erro, valores });

  const dados = schema.safeParse(valores);
  if (!dados.success) return falha(dados.error.issues[0].message);

  const propriedade = await obterPropriedade(sessao, dados.data.propriedade);
  if (!propriedade) return falha("Propriedade não encontrada.");

  const areaHa = lerDecimal(dados.data.area);
  if (!Number.isFinite(areaHa) || areaHa <= 0) return falha("Informe uma área maior que zero");
  if (areaHa > propriedade.areaHa) {
    return falha(
      `A área do projeto não pode passar da área da propriedade (${formatHectares(propriedade.areaHa)}).`,
    );
  }

  if (sessao.modo === "demo") {
    return falha(
      "No modo demonstração o cadastro não é salvo. Configure o Supabase para criar projetos.",
    );
  }

  const id = await criarProjeto(sessao, {
    propriedadeId: propriedade.id,
    titulo: dados.data.titulo,
    descricao: dados.data.descricao,
    pratica: dados.data.pratica,
    areaHa,
    objetivo: dados.data.objetivo,
    inicio: dados.data.inicio,
    fim: dados.data.fim,
    metodologia: dados.data.metodologia,
    infoComercial: dados.data.infoComercial,
    publicado: dados.data.publicar === "on",
  });

  revalidatePath("/produtor");
  revalidatePath("/produtor/projetos");
  revalidatePath("/marketplace");
  redirect(`/produtor/projetos/${id}`);
}
