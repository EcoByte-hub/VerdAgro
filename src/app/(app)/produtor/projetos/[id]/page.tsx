import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowUpRight, Eye, EyeOff, FileText, MapPin } from "lucide-react";
import { Cabecalho } from "@/components/app/cabecalho";
import { BotaoPublicacao } from "@/components/projeto/botao-publicacao";
import { DadosProjeto } from "@/components/projeto/dados-projeto";
import { LinhaDoTempo } from "@/components/projeto/linha-do-tempo";
import { SeloEstagio } from "@/components/projeto/selo-estagio";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardEyebrow } from "@/components/ui/card";
import { DemoTag, Tag } from "@/components/ui/tag";
import { exigirPapel } from "@/lib/auth/sessao";
import { listarInteresses, obterProjetoDoProdutor } from "@/lib/dados";
import { ROTULO_DOCUMENTO, ROTULO_STATUS, type ProjetoDoProdutor } from "@/lib/dados/tipos";
import { ROTULO_PRATICA } from "@/lib/diagnostico/schema";
import { cn, formatHectares, formatNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Meu projeto" };

/** Datas "AAAA-MM-DD" do banco: meio-dia evita voltar um dia por causa do fuso. */
const formatarDia = (dia: string | null) =>
  dia ? new Date(`${dia}T12:00:00`).toLocaleDateString("pt-BR") : null;
const formatarData = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");

export default function ProjetoDoProdutorPage({ params }: PageProps<"/produtor/projetos/[id]">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-[var(--radius-card)] bg-areia" />}>
      <Conteudo params={params} />
    </Suspense>
  );
}

async function Conteudo({ params }: { params: PageProps<"/produtor/projetos/[id]">["params"] }) {
  const { id } = await params;
  const sessao = await exigirPapel("produtor");
  const [p, todosInteresses] = await Promise.all([
    obterProjetoDoProdutor(sessao, id),
    listarInteresses(sessao),
  ]);
  if (!p) notFound();
  const interesses = todosInteresses.filter((i) => i.projetoId === p.id);

  return (
    <>
      <Cabecalho
        eyebrow="Meu projeto"
        titulo={p.titulo}
        descricao={
          <span className="flex flex-wrap items-center gap-x-1.5">
            <MapPin size={15} className="shrink-0" />
            <Link
              href={`/produtor/propriedades/${p.propriedade.id}`}
              className="font-semibold text-musgo underline-offset-4 hover:underline"
            >
              {p.propriedade.nome}
            </Link>
            <span>
              · {p.municipio}/{p.uf}
            </span>
          </span>
        }
        acoes={
          <>
            <SeloEstagio estagio={p.estagio} />
            {p.isDemo && <DemoTag />}
          </>
        }
      />

      <Card
        className={cn(
          // Lado a lado só no xl: antes disso (com a sidebar no lg) o texto fica espremido
          "mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between",
          p.publicado && "border-broto-700/40 bg-broto/15",
        )}
      >
        <div className="flex items-start gap-3">
          {p.publicado ? (
            <Eye size={20} className="mt-0.5 shrink-0 text-musgo" aria-hidden />
          ) : (
            <EyeOff size={20} className="mt-0.5 shrink-0 text-tinta-soft" aria-hidden />
          )}
          <div>
            <p className="font-semibold text-tinta">
              {p.publicado ? "Publicado no marketplace" : "Não publicado"}
            </p>
            <p className="mt-0.5 text-sm text-tinta-soft">
              {p.publicado
                ? "Empresas encontram o projeto e podem manifestar interesse. Elas veem só a região, nunca o mapa da fazenda."
                : "Só você vê este projeto. Publique quando quiser receber interesse de empresas."}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-start">
          {p.publicado && (
            <Link
              href={`/marketplace/${p.id}`}
              className={buttonClasses({ variant: "ghost", className: "w-full sm:w-auto" })}
            >
              Ver no marketplace <ArrowUpRight size={16} />
            </Link>
          )}
          <BotaoPublicacao projetoId={p.id} publicado={p.publicado} />
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <DadosProjeto
            projetoId={p.id}
            areaMaxima={p.propriedade.areaHa}
            inicial={{
              titulo: p.titulo,
              descricao: p.descricao,
              objetivo: p.objetivo,
              pratica: p.pratica,
              areaHa: p.areaHa,
              metodologia: p.metodologia,
              inicio: p.inicio,
              fim: p.fim,
              infoComercial: p.infoComercial,
            }}
          >
            <VisaoDados p={p} />
          </DadosProjeto>

          <Card>
            <CardEyebrow>Documentos e evidências</CardEyebrow>
            {p.documentos.length ? (
              <ul className="mt-3 divide-y divide-areia">
                {p.documentos.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 py-3">
                    <FileText size={18} className="shrink-0 text-musgo" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-tinta">{d.nome}</p>
                      <p className="text-xs text-tinta-soft">
                        {ROTULO_DOCUMENTO[d.tipo] ?? d.tipo} · {formatarData(d.criadoEm)}
                      </p>
                    </div>
                    {d.url && (
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-sm font-semibold text-musgo underline-offset-4 hover:underline"
                      >
                        Abrir
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-tinta-soft">
                Nenhum documento anexado ainda. Evidências como CAR, notas fiscais e laudos dão mais confiança
                a quem compra.
              </p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardEyebrow>Interesses recebidos</CardEyebrow>
            {interesses.length ? (
              <ul className="mt-4 space-y-3">
                {interesses.map((i) => (
                  <li key={i.id} className="rounded-2xl border border-broto-700/40 bg-broto/15 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-tinta">{i.contraparte ?? "Empresa"}</p>
                      <Tag kind="neutro">{ROTULO_STATUS[i.status]}</Tag>
                    </div>
                    <p className="mt-2 text-sm text-tinta">{i.mensagem}</p>
                    <p className="mt-2 text-xs text-tinta-soft">
                      {formatarData(i.criadoEm)}
                      {i.volumeProposto !== null &&
                        ` · ${formatNumber(i.volumeProposto)} tCO₂e de referência`}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-tinta-soft">
                {p.publicado
                  ? "Nenhuma empresa manifestou interesse ainda."
                  : "Publique o projeto no marketplace para receber interesse de empresas."}
              </p>
            )}
          </Card>

          <Card>
            <CardEyebrow>Rastreabilidade</CardEyebrow>
            <div className="mt-4">
              <LinhaDoTempo atual={p.estagio} eventos={p.linhaDoTempo} />
            </div>
            <p className="mt-6 text-xs text-tinta-soft">
              O estágio avança com a validação e a verificação independentes. Créditos só existem depois da
              emissão por um registro oficial.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}

function VisaoDados({ p }: { p: ProjetoDoProdutor }) {
  const itens = [
    ["Prática", ROTULO_PRATICA[p.pratica]],
    ["Área do projeto", `${formatHectares(p.areaHa)} de ${formatHectares(p.propriedade.areaHa)}`],
    ["Metodologia de referência", p.metodologia ?? "A definir"],
    [
      "Créditos emitidos",
      p.creditosEmitidos === null ? "Nenhum até agora" : `${formatNumber(p.creditosEmitidos)} tCO₂e`,
    ],
    ["Início", formatarDia(p.inicio) ?? "A definir"],
    ["Término previsto", formatarDia(p.fim) ?? "A definir"],
  ];

  return (
    <>
      {p.descricao ? (
        <p className="text-tinta">{p.descricao}</p>
      ) : (
        <p className="text-sm text-tinta-soft">
          Sem descrição. Conte o que será feito: é o primeiro texto que as empresas leem no marketplace.
        </p>
      )}
      {p.objetivo && <p className="mt-3 text-sm text-tinta-soft">Objetivo: {p.objetivo}</p>}

      <dl className="mt-6 grid gap-3 sm:grid-cols-2">
        {itens.map(([rotulo, valor]) => (
          <div key={rotulo} className="rounded-xl bg-areia/50 p-3">
            <dt className="text-xs text-tinta-soft">{rotulo}</dt>
            <dd className="text-sm font-semibold text-tinta">{valor}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6">
        <p className="text-xs text-tinta-soft">Informações comerciais</p>
        <p className="mt-1 text-sm text-tinta">{p.infoComercial ?? "Nenhuma informada."}</p>
      </div>
    </>
  );
}
