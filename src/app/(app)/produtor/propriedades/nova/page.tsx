import type { Metadata } from "next";
import { Suspense } from "react";
import { Carregando } from "@/components/app/carregando";
import { Cabecalho } from "@/components/app/cabecalho";
import { FormPropriedade } from "@/components/propriedade/form-propriedade";
import { exigirPapel } from "@/lib/auth/sessao";

export const metadata: Metadata = { title: "Nova propriedade" };

async function Conteudo() {
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

export default function NovaPropriedadePage() {
  return (
    <Suspense fallback={<Carregando />}>
      <Conteudo />
    </Suspense>
  );
}
