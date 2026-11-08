import type { Metadata } from "next";
import { Suspense } from "react";
import { Carregando } from "@/components/app/carregando";
import Link from "next/link";
import { Bell, MapPinned, Plus } from "lucide-react";
import { Cabecalho } from "@/components/app/cabecalho";
import { CardProjeto } from "@/components/projeto/card-projeto";
import { CardPropriedade } from "@/components/propriedade/card-propriedade";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardEyebrow, CardTitle } from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
import { exigirPapel } from "@/lib/auth/sessao";
import { listarInteresses, listarProjetosDoProdutor, listarPropriedades } from "@/lib/dados";
import { ROTULO_STATUS } from "@/lib/dados/tipos";

export const metadata: Metadata = { title: "Painel do produtor" };

async function Conteudo() {
  const sessao = await exigirPapel("produtor");
  const [propriedades, projetos, interesses] = await Promise.all([
    listarPropriedades(sessao),
    listarProjetosDoProdutor(sessao),
    listarInteresses(sessao),
  ]);

  return (
    <>
      <Cabecalho
        eyebrow="Painel do produtor"
        titulo={`Olá, ${sessao.nome.split(" ")[0]}`}
        descricao="Acompanhe suas propriedades, projetos e o interesse de empresas."
        acoes={
          <Link href="/produtor/propriedades/nova" className={buttonClasses({})}>
            <Plus size={18} /> Nova propriedade
          </Link>
        }
      />

      {interesses.length > 0 && (
        <section aria-labelledby="interesses" className="mb-10">
          <h2 id="interesses" className="mb-3 flex items-center gap-2 text-sm font-semibold text-tinta">
            <Bell size={16} className="text-musgo" /> Interesses recebidos
          </h2>
          <div className="grid gap-3">
            {interesses.map((i) => (
              <Card key={i.id} className="border-broto-700/40 bg-broto/15">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardEyebrow className="text-musgo">
                    {i.contraparte ?? "Empresa"} · {i.projetoTitulo}
                  </CardEyebrow>
                  <Tag kind="neutro">{ROTULO_STATUS[i.status]}</Tag>
                </div>
                <p className="mt-3 text-tinta">{i.mensagem}</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="propriedades" className="mb-10">
        <h2 id="propriedades" className="mb-3 text-sm font-semibold text-tinta">
          Propriedades
        </h2>
        {propriedades.length ? (
          <div className="grid gap-3">
            {propriedades.map((p) => (
              <CardPropriedade key={p.id} propriedade={p} />
            ))}
          </div>
        ) : (
          <Card className="flex flex-col items-start gap-4 border-dashed">
            <MapPinned className="text-musgo" />
            <div>
              <CardTitle>Cadastre sua primeira propriedade</CardTitle>
              <p className="mt-1 text-sm text-tinta-soft">
                Desenhe os limites no mapa e receba um diagnóstico ambiental inicial.
              </p>
            </div>
            <Link href="/produtor/propriedades/nova" className={buttonClasses({ size: "sm" })}>
              Começar
            </Link>
          </Card>
        )}
      </section>

      <section aria-labelledby="projetos">
        <h2 id="projetos" className="mb-3 text-sm font-semibold text-tinta">
          Projetos
        </h2>
        {projetos.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projetos.map((p) => (
              <CardProjeto key={p.id} projeto={p} href={`/marketplace/${p.id}`} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-tinta-soft">
            Nenhum projeto ainda. Gere o diagnóstico de uma propriedade para começar.
          </p>
        )}
      </section>
    </>
  );
}

export default function PainelProdutor() {
  return (
    <Suspense fallback={<Carregando />}>
      <Conteudo />
    </Suspense>
  );
}
