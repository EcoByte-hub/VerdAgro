import type { Metadata } from "next";
import { Suspense } from "react";
import { RefreshCw } from "lucide-react";
import { Carregando } from "@/components/app/carregando";
import { Cabecalho } from "@/components/app/cabecalho";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { DemoTag, Tag } from "@/components/ui/tag";
import { exigirPapel } from "@/lib/auth/sessao";
import { obterIndicadoresAdmin } from "@/lib/dados";
import type { IndicadoresAdmin } from "@/lib/dados/tipos";
import { cn, formatNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Administração" };

async function Conteudo() {
  const sessao = await exigirPapel("admin");
  let indicadores: IndicadoresAdmin | null = null;
  try {
    indicadores = await obterIndicadoresAdmin(sessao);
  } catch {
    // Uma consulta com falha nunca deve aparecer como totais zerados ou dados demo.
  }
  const consultadoEm = new Date();

  return (
    <>
      <Cabecalho
        eyebrow="Administração"
        titulo="Indicadores da plataforma"
        descricao="Acompanhe a participação, os projetos e os resultados da plataforma."
        acoes={
          <form action="/admin" method="get">
            <Button type="submit" variant="secondary">
              <RefreshCw size={16} aria-hidden /> Atualizar indicadores
            </Button>
          </form>
        }
      />
      {indicadores ? (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-3 text-xs text-tinta-soft">
            <p>
              Consultado em{" "}
              <time dateTime={consultadoEm.toISOString()}>
                {new Intl.DateTimeFormat("pt-BR", {
                  dateStyle: "short",
                  timeStyle: "short",
                  timeZone: "America/Sao_Paulo",
                }).format(consultadoEm)}
              </time>{" "}
              (Brasília)
            </p>
            {(sessao.modo === "demo" || indicadores.propriedadesDemo > 0) && <DemoTag />}
          </div>

          <section aria-labelledby="participacao" className="mb-10">
            <h2 id="participacao" className="mb-3 text-sm font-semibold text-tinta">
              Participação na plataforma
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <Indicador
                titulo="Produtores"
                valor={formatNumber(indicadores.produtores)}
                descricao="Contas de produtores cadastradas."
              />
              <Indicador
                titulo="Propriedades"
                valor={formatNumber(indicadores.propriedades)}
                descricao="Propriedades rurais cadastradas."
              />
              <Indicador
                titulo="Hectares cadastrados"
                valor={`${formatNumber(indicadores.hectares, 2)} ha`}
                descricao="Soma das áreas das propriedades, sem repetir por projeto."
              />
              <Indicador
                titulo="Projetos"
                valor={formatNumber(indicadores.projetos)}
                descricao="Todos os projetos, incluindo os não publicados."
              />
              <Indicador
                titulo="Empresas"
                valor={formatNumber(indicadores.empresas)}
                descricao="Contas de empresas compradoras cadastradas."
              />
              <Indicador
                titulo="Interesses"
                valor={formatNumber(indicadores.interesses)}
                descricao="Manifestações recebidas, em todos os status."
              />
            </div>
            {sessao.modo === "demo" ? (
              <p className="mt-3 text-xs text-tinta-soft">
                Totais do catálogo demonstrativo em memória. Alterações neste modo não são salvas.
              </p>
            ) : indicadores.propriedadesDemo > 0 ? (
              <p className="mt-3 text-xs text-tinta-soft">
                Os totais incluem {formatNumber(indicadores.propriedadesDemo)}{" "}
                {indicadores.propriedadesDemo === 1 ? "propriedade" : "propriedades"} com dados
                demonstrativos.
              </p>
            ) : null}
          </section>

          <section aria-labelledby="resultados">
            <h2 id="resultados" className="mb-3 text-sm font-semibold text-tinta">
              Validação e créditos de carbono
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <Indicador
                titulo="Projetos em validação"
                valor={formatNumber(indicadores.projetosEmValidacao)}
                descricao="Somente projetos no estágio atual de validação."
                selo={<Tag kind="verificacao">Em validação</Tag>}
              />
              <Indicador
                titulo="Créditos emitidos"
                valor={`${formatNumber(indicadores.creditosEmitidos, 2)} tCO₂e`}
                descricao="Volume registrado nos projetos em emissão de créditos ou comercialização."
                selo={<Tag kind="certificado">Emitido</Tag>}
              />
              <Card className="border-dashed border-cerrado">
                <Tag kind="estimativa">Estimativa</Tag>
                <CardTitle className="mt-4">Volume estimado</CardTitle>
                <p className="mt-3 text-lg font-semibold text-cerrado">Não disponível</p>
                <p className="mt-2 text-sm text-tinta-soft">
                  A plataforma não calcula estimativas de carbono. Diagnósticos e volumes de interesse não são
                  créditos emitidos.
                </p>
              </Card>
            </div>
          </section>
        </>
      ) : (
        <Card role="alert" className="border-erro/30">
          <CardTitle>Não foi possível carregar os indicadores</CardTitle>
          <p className="mt-2 text-sm text-tinta-soft">
            Os totais estão indisponíveis no momento. Use “Atualizar indicadores” para tentar novamente.
          </p>
        </Card>
      )}
    </>
  );
}

function Indicador({
  titulo,
  valor,
  descricao,
  selo,
}: {
  titulo: string;
  valor: string;
  descricao: string;
  selo?: React.ReactNode;
}) {
  return (
    <Card className="min-w-0">
      {selo && <div className="mb-4">{selo}</div>}
      <CardTitle>{titulo}</CardTitle>
      <p
        className={cn(
          "mt-3 font-mono font-medium tracking-tight [overflow-wrap:anywhere] text-mata-900 tabular-nums",
          valor.length > 18 ? "text-lg" : "text-3xl",
        )}
      >
        {valor}
      </p>
      <p className="mt-2 text-sm text-tinta-soft">{descricao}</p>
    </Card>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<Carregando />}>
      <Conteudo />
    </Suspense>
  );
}
