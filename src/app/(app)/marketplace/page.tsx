import type { Metadata } from "next";
import { Suspense } from "react";
import { Search } from "lucide-react";
import { Cabecalho } from "@/components/app/cabecalho";
import { CardProjeto } from "@/components/projeto/card-projeto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SeletorOpcoes } from "@/components/ui/seletor-opcoes";
import { Tag } from "@/components/ui/tag";
import { exigirPapel } from "@/lib/auth/sessao";
import { listarMarketplace } from "@/lib/dados";
import type { Pratica } from "@/lib/dados/tipos";
import { PRATICAS, ROTULO_PRATICA } from "@/lib/diagnostico/schema";
import { OPCOES_UF } from "@/lib/geo/ufs";

export const metadata: Metadata = { title: "Marketplace" };

const OPCOES_PRATICA = PRATICAS.map((p) => ({ valor: p, rotulo: ROTULO_PRATICA[p] }));

export default function MarketplacePage({ searchParams }: PageProps<"/marketplace">) {
  return (
    <>
      <Cabecalho
        eyebrow="Marketplace"
        titulo="Projetos de carbono no agro"
        descricao="Encontre projetos por região e prática, veja o estágio de cada um e manifeste interesse."
      />
      <div className="mb-6 flex flex-wrap gap-2 text-xs text-tinta-soft">
        <Tag kind="estimativa">Estimativa</Tag>
        <Tag kind="verificacao">Em verificação</Tag>
        <Tag kind="certificado">Certificado</Tag>
        <span className="self-center">
          Créditos só existem a partir da emissão por verificação independente.
        </span>
      </div>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-areia" />}>
        <Resultados searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Resultados({ searchParams }: { searchParams: PageProps<"/marketplace">["searchParams"] }) {
  const sp = await searchParams;
  const texto = (v: string | string[] | undefined) => (typeof v === "string" && v ? v : undefined);
  const filtros = {
    busca: texto(sp.busca),
    uf: texto(sp.uf),
    pratica: PRATICAS.includes(sp.pratica as Pratica) ? (sp.pratica as Pratica) : undefined,
  };

  const sessao = await exigirPapel("empresa", "produtor", "admin");
  const projetos = await listarMarketplace(sessao, filtros);

  return (
    <>
      {/* Uma linha só no xl; antes disso a busca ganha a linha de cima para não ficar espremida */}
      <form className="mb-8 grid gap-3 rounded-[var(--radius-card)] border border-areia bg-palha-50 p-4 sm:grid-cols-[160px_1fr_auto] xl:grid-cols-[1fr_160px_240px_auto]">
        <label className="relative sm:col-span-full xl:col-span-1">
          <span className="sr-only">Buscar</span>
          <Search size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-argila" />
          <Input
            name="busca"
            defaultValue={filtros.busca}
            placeholder="Buscar por projeto ou município"
            className="pl-10"
          />
        </label>
        <SeletorOpcoes
          name="uf"
          rotulo="UF"
          opcoes={OPCOES_UF}
          defaultValue={filtros.uf}
          opcaoVazia="Todas as UFs"
          buscavel
          placeholderBusca="Buscar estado"
        />
        <SeletorOpcoes
          name="pratica"
          rotulo="Prática"
          opcoes={OPCOES_PRATICA}
          defaultValue={filtros.pratica}
          opcaoVazia="Todas as práticas"
        />
        <Button type="submit" variant="dark">
          Filtrar
        </Button>
      </form>

      {projetos.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projetos.map((p) => (
            <CardProjeto key={p.id} projeto={p} href={`/marketplace/${p.id}`} />
          ))}
        </div>
      ) : (
        <p className="rounded-[var(--radius-card)] border border-dashed border-argila p-10 text-center text-tinta-soft">
          Nenhum projeto encontrado com esses filtros.
        </p>
      )}
    </>
  );
}
