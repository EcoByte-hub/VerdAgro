import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sprout } from "lucide-react";
import { Cabecalho } from "@/components/app/cabecalho";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardEyebrow } from "@/components/ui/card";
import { exigirPapel } from "@/lib/auth/sessao";
import { listarPropriedades } from "@/lib/dados";
import type { Pratica } from "@/lib/dados/tipos";
import { PRATICAS } from "@/lib/diagnostico/schema";
import { FormularioNovoProjeto } from "./formulario-novo-projeto";

export const metadata: Metadata = { title: "Novo projeto" };

/**
 * Passo 3 da demo: o produtor cadastra um projeto a partir da propriedade e do
 * diagnóstico. A prática e o título chegam pré-preenchidos quando a origem é uma
 * oportunidade do diagnóstico (?propriedade=&pratica=&titulo=).
 */
export default async function NovoProjetoPage({
  searchParams,
}: PageProps<"/produtor/projetos/nova">) {
  const sessao = await exigirPapel("produtor");
  const [sp, propriedades] = await Promise.all([searchParams, listarPropriedades(sessao)]);

  const param = (nome: string) => (typeof sp[nome] === "string" ? sp[nome] : null);
  const praticaParam = param("pratica");
  const pratica =
    praticaParam && (PRATICAS as readonly string[]).includes(praticaParam)
      ? (praticaParam as Pratica)
      : null;
  const preSelecao = {
    propriedadeId: param("propriedade"),
    titulo: param("titulo")?.slice(0, 120) ?? null,
    pratica,
  };

  if (!propriedades.length) {
    return (
      <>
        <Cabecalho eyebrow="Projetos de carbono" titulo="Novo projeto" />
        <Card className="flex flex-col items-start gap-4 border-dashed">
          <Sprout className="text-musgo" />
          <div>
            <CardEyebrow>Cadastre uma propriedade primeiro</CardEyebrow>
            <p className="mt-1 text-sm text-tinta-soft">
              Todo projeto nasce dentro de uma propriedade: o diagnóstico e a área disponível vêm dela.
            </p>
          </div>
          <Link href="/produtor/propriedades/nova" className={buttonClasses({ size: "sm" })}>
            Nova propriedade
          </Link>
        </Card>
      </>
    );
  }

  return (
    <>
      <Cabecalho
        eyebrow="Projetos de carbono"
        titulo="Novo projeto"
        descricao="Defina a prática e a área de projeto — depois publique no marketplace quando quiser."
        acoes={
          <Link href="/produtor/projetos" className={buttonClasses({ variant: "ghost", size: "sm" })}>
            <ArrowLeft size={14} /> Meus projetos
          </Link>
        }
      />

      <Card>
        <FormularioNovoProjeto
          propriedades={propriedades.map((p) => ({
            id: p.id,
            nome: p.nome,
            municipio: p.municipio,
            uf: p.uf,
            areaHa: p.areaHa,
            isDemo: p.isDemo,
          }))}
          inicial={preSelecao}
        />
      </Card>
    </>
  );
}
