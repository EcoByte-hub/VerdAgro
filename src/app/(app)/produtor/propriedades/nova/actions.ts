"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { exigirPapel } from "@/lib/auth/sessao";
import { criarPropriedade } from "@/lib/dados";
import { PRATICAS } from "@/lib/diagnostico/schema";
import { paraWKT, validarPoligono } from "@/lib/geo/poligono";

export type EstadoNovaPropriedade = { erro?: string } | undefined;

const UFS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

const schema = z.object({
  nome: z.string().trim().min(2, "Informe o nome da propriedade"),
  municipio: z.string().trim().min(2, "Informe o município"),
  uf: z.enum(UFS, "Escolha a UF"),
  producao: z.string().trim().optional(),
  culturas: z.string().trim().optional(),
  historico: z.string().trim().max(2000).optional(),
  poligono: z.string().min(1, "Desenhe o limite da propriedade no mapa"),
});

export async function salvarPropriedade(
  _: EstadoNovaPropriedade,
  formData: FormData,
): Promise<EstadoNovaPropriedade> {
  const sessao = await exigirPapel("produtor");

  const dados = schema.safeParse(Object.fromEntries(formData));
  if (!dados.success) return { erro: dados.error.issues[0].message };

  let geo: unknown;
  try {
    geo = JSON.parse(dados.data.poligono);
  } catch {
    return { erro: "Polígono inválido" };
  }
  const poligono = validarPoligono(geo);
  if (!poligono.ok) return { erro: poligono.erro };

  const praticas = PRATICAS.filter((p) => formData.get(`pratica_${p}`) === "on").map((p) => {
    const desde = Number(formData.get(`desde_${p}`));
    return { pratica: p, desde: Number.isInteger(desde) && desde >= 1950 && desde <= 2100 ? desde : null };
  });

  if (sessao.modo === "demo") {
    return {
      erro: "No modo demonstração o cadastro não é salvo. Configure o Supabase para cadastrar propriedades.",
    };
  }

  const id = await criarPropriedade(sessao, {
    nome: dados.data.nome,
    municipio: dados.data.municipio,
    uf: dados.data.uf,
    producao: dados.data.producao || null,
    culturas: (dados.data.culturas ?? "")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean),
    historico: dados.data.historico || null,
    poligonoWKT: paraWKT(poligono.poligono),
    praticas,
  });

  redirect(`/produtor/propriedades/${id}`);
}
