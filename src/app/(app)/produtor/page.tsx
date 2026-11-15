import type { Metadata } from "next";
import { Suspense } from "react";
import { Carregando } from "@/components/app/carregando";
import Link from "next/link";
import { Bell, BellRing, MapPinned, Plus } from "lucide-react";
import { Cabecalho } from "@/components/app/cabecalho";
import { CardProjeto } from "@/components/projeto/card-projeto";
import { InteresseRecebido } from "@/components/projeto/interesse-recebido";
import { CardPropriedade } from "@/components/propriedade/card-propriedade";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
import { exigirPapel } from "@/lib/auth/sessao";
import { listarInteresses, listarProjetosDoProdutor, listarPropriedades } from "@/lib/dados";
import { contarNovosPorProjeto, ordenarPorAtencao, rotuloNovos, somarNovos } from "@/lib/interesses";

export const metadata: Metadata = { title: "Painel do produtor" };

async function Conteudo() {
  const sessao = await exigirPapel("produtor");
  const [propriedades, projetos, interesses] = await Promise.all([
    listarPropriedades(sessao),
    listarProjetosDoProdutor(sessao),
    listarInteresses(sessao),
  ]);
  const novosPorProjeto = contarNovosPorProjeto(interesses);
  const totalNovos = somarNovos(novosPorProjeto);

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
          <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <h2 id="interesses" className="flex items-center gap-2 text-sm font-semibold text-tinta">
              {totalNovos > 0 ? (
                <BellRing size={16} className="text-musgo" aria-hidden />
              ) : (
                <Bell size={16} className="text-musgo" aria-hidden />
              )}
              Interesses recebidos
            </h2>
            {totalNovos > 0 && <Tag kind="novo">{rotuloNovos(totalNovos)}</Tag>}
          </div>
          <ul className="grid gap-3">
            {ordenarPorAtencao(interesses).map((i) => (
              <li key={i.id}>
                <InteresseRecebido interesse={i} mostrarProjeto />
              </li>
            ))}
          </ul>
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
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="projetos" className="text-sm font-semibold text-tinta">
            Projetos
          </h2>
          {projetos.length > 0 && (
            <Link
              href="/produtor/projetos"
              className="text-sm font-semibold text-musgo underline-offset-4 hover:underline"
            >
              Gerenciar projetos
            </Link>
          )}
        </div>
        {projetos.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projetos.map((p) => (
              <CardProjeto
                key={p.id}
                projeto={p}
                href={`/produtor/projetos/${p.id}`}
                mostrarPublicacao
                interessesNovos={novosPorProjeto[p.id]}
              />
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
