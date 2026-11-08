import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Cabecalho } from "@/components/app/cabecalho";
import { PainelDiagnostico } from "@/components/diagnostico/painel-diagnostico";
import { MapaPropriedade } from "@/components/mapa";
import { Card, CardEyebrow } from "@/components/ui/card";
import { DemoTag } from "@/components/ui/tag";
import { exigirPapel } from "@/lib/auth/sessao";
import { obterPropriedade } from "@/lib/dados";
import { ROTULO_PRATICA } from "@/lib/diagnostico/schema";
import { formatHectares } from "@/lib/utils";

export const metadata: Metadata = { title: "Propriedade" };

export default function PropriedadePage({ params }: PageProps<"/produtor/propriedades/[id]">) {
  return (
    <Suspense fallback={<div className="h-[440px] animate-pulse rounded-[var(--radius-card)] bg-areia" />}>
      <Conteudo params={params} />
    </Suspense>
  );
}

async function Conteudo({ params }: { params: PageProps<"/produtor/propriedades/[id]">["params"] }) {
  const { id } = await params;
  const sessao = await exigirPapel("produtor");
  const p = await obterPropriedade(sessao, id);
  if (!p) notFound();

  return (
    <>
      <Cabecalho
        eyebrow={`${p.municipio}/${p.uf}`}
        titulo={p.nome}
        descricao={p.historico ?? undefined}
        acoes={p.isDemo ? <DemoTag /> : undefined}
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <MapaPropriedade
          poligono={p.poligono}
          className="h-[360px] overflow-hidden rounded-[var(--radius-card)] sm:h-[440px]"
        />

        <div className="grid content-start gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <Card>
            <CardEyebrow>Área</CardEyebrow>
            <p className="mt-2 font-display-soft text-3xl text-mata-900">{formatHectares(p.areaHa)}</p>
          </Card>
          <Card>
            <CardEyebrow>Produção</CardEyebrow>
            <p className="mt-2 font-semibold text-tinta">{p.producao ?? "Não informado"}</p>
            <p className="text-sm text-tinta-soft">{p.culturas.join(", ") || "Culturas não informadas"}</p>
          </Card>
          <Card className="sm:col-span-2 xl:col-span-1">
            <CardEyebrow>Práticas informadas</CardEyebrow>
            <ul className="mt-2 space-y-1 text-sm">
              {p.praticas.length ? (
                p.praticas.map((x) => (
                  <li key={x.pratica} className="text-tinta">
                    {ROTULO_PRATICA[x.pratica]}
                    {x.desde && <span className="text-tinta-soft"> · desde {x.desde}</span>}
                  </li>
                ))
              ) : (
                <li className="text-tinta-soft">Nenhuma prática informada</li>
              )}
            </ul>
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <PainelDiagnostico propriedadeId={p.id} />
      </div>
    </>
  );
}
