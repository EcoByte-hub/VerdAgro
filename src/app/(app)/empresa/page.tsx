import type { Metadata } from "next";
import { Suspense } from "react";
import { Carregando } from "@/components/app/carregando";
import Link from "next/link";
import { Store } from "lucide-react";
import { Cabecalho } from "@/components/app/cabecalho";
import { CardProjeto } from "@/components/projeto/card-projeto";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardEyebrow } from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
import { exigirPapel } from "@/lib/auth/sessao";
import { listarInteresses, listarMarketplace } from "@/lib/dados";
import { ROTULO_STATUS } from "@/lib/dados/tipos";
import { formatNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Painel da empresa" };

async function Conteudo() {
  const sessao = await exigirPapel("empresa");
  const [projetos, interesses] = await Promise.all([listarMarketplace(sessao), listarInteresses(sessao)]);

  return (
    <>
      <Cabecalho
        eyebrow={sessao.organizacao ?? "Painel da empresa"}
        titulo={`Olá, ${sessao.nome.split(" ")[0]}`}
        descricao="Projetos com origem rastreável e suas negociações em andamento."
        acoes={
          <Link href="/marketplace" className={buttonClasses({})}>
            <Store size={18} /> Explorar marketplace
          </Link>
        }
      />

      <section className="mb-10" aria-labelledby="negociacoes">
        <h2 id="negociacoes" className="mb-3 text-sm font-semibold text-tinta">
          Minhas negociações
        </h2>
        {interesses.length ? (
          <div className="grid gap-3">
            {interesses.map((i) => (
              <Link key={i.id} href={`/marketplace/${i.projetoId}`}>
                <Card className="transition-colors hover:border-mata-900/30">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardEyebrow>
                      {i.projetoTitulo} · {i.contraparte ?? "Produtor"}
                    </CardEyebrow>
                    <Tag kind="neutro">{ROTULO_STATUS[i.status]}</Tag>
                  </div>
                  <p className="mt-2 line-clamp-2 text-tinta">{i.mensagem}</p>
                  {i.volumeProposto && (
                    <p className="mt-2 text-xs text-tinta-soft">
                      Volume de interesse: {formatNumber(i.volumeProposto)} tCO₂e
                    </p>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-tinta-soft">
            Nenhuma negociação ainda. Encontre projetos no marketplace.
          </p>
        )}
      </section>

      <section aria-labelledby="destaques">
        <h2 id="destaques" className="mb-3 text-sm font-semibold text-tinta">
          Projetos em destaque
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projetos.slice(0, 6).map((p) => (
            <CardProjeto key={p.id} projeto={p} href={`/marketplace/${p.id}`} />
          ))}
        </div>
      </section>
    </>
  );
}

export default function PainelEmpresa() {
  return (
    <Suspense fallback={<Carregando />}>
      <Conteudo />
    </Suspense>
  );
}
