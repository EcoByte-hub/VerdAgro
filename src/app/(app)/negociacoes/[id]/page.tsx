import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Carregando } from "@/components/app/carregando";
import { Cabecalho } from "@/components/app/cabecalho";
import { ConversaNegociacao } from "@/components/negociacao/conversa-negociacao";
import { RespostaNegociacao } from "@/components/negociacao/resposta-negociacao";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DemoTag, Tag } from "@/components/ui/tag";
import { exigirPapel } from "@/lib/auth/sessao";
import { obterNegociacao } from "@/lib/dados/negociacoes";
import { ROTULO_STATUS } from "@/lib/dados/tipos";
import { formatNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Negociação" };

export default function NegociacaoPage({ params }: PageProps<"/negociacoes/[id]">) {
  return (
    <Suspense fallback={<Carregando />}>
      <Conteudo params={params} />
    </Suspense>
  );
}

async function Conteudo({ params }: { params: PageProps<"/negociacoes/[id]">["params"] }) {
  const sessao = await exigirPapel("produtor", "empresa");
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const negociacao = await obterNegociacao(sessao, id);
  if (!negociacao) notFound();

  const produtor = sessao.papel === "produtor";
  const projetoHref = produtor
    ? `/produtor/projetos/${negociacao.projetoId}`
    : `/marketplace/${negociacao.projetoId}`;

  return (
    <div className="mx-auto max-w-5xl min-w-0">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link
          href={produtor ? "/produtor" : "/empresa"}
          className={buttonClasses({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft size={16} aria-hidden /> Voltar ao painel
        </Link>
        {(produtor || negociacao.donoProjetoId) && (
          <Link
            href={projetoHref}
            className="inline-flex items-center gap-1 text-sm font-semibold text-musgo underline-offset-4 hover:underline"
          >
            Ver projeto <ArrowUpRight size={16} aria-hidden />
          </Link>
        )}
      </div>
      <Cabecalho
        eyebrow="Negociação"
        titulo={<span className="wrap-anywhere">{negociacao.projetoTitulo}</span>}
        descricao={
          <span className="wrap-anywhere">
            Conversa com {negociacao.contraparte ?? (produtor ? "a empresa" : "o produtor")}.
          </span>
        }
        acoes={
          <>
            <Tag kind="neutro">{ROTULO_STATUS[negociacao.status]}</Tag>
            {sessao.modo === "demo" && <DemoTag />}
          </>
        }
      />
      <Card className="mb-6 text-sm text-tinta-soft">
        {negociacao.volumeProposto !== null && (
          <p className="mb-2 font-semibold text-tinta">
            Volume de referência: {formatNumber(negociacao.volumeProposto)} tCO₂e
          </p>
        )}
        <p>O aceite registra o interesse no projeto. Não realiza compra, emissão de créditos ou pagamento.</p>
      </Card>
      {produtor && (
        <div className="mb-6">
          <RespostaNegociacao
            interesseId={negociacao.id}
            status={negociacao.status}
            demo={sessao.modo === "demo"}
          />
        </div>
      )}
      <ConversaNegociacao negociacao={negociacao} usuarioId={sessao.id} demo={sessao.modo === "demo"} />
    </div>
  );
}
