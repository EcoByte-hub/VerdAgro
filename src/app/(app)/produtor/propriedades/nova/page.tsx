import type { Metadata } from "next";
import { Cabecalho } from "@/components/app/cabecalho";
import { FormPropriedade } from "@/components/propriedade/form-propriedade";
import { exigirPapel } from "@/lib/auth/sessao";

export const metadata: Metadata = { title: "Nova propriedade" };

export default async function NovaPropriedadePage() {
  await exigirPapel("produtor");
  return (
    <>
      <Cabecalho
        eyebrow="Cadastro"
        titulo="Nova propriedade"
        descricao="Desenhe o limite no mapa e conte um pouco sobre o manejo. Esses dados alimentam o diagnóstico."
      />
      <FormPropriedade />
    </>
  );
}
