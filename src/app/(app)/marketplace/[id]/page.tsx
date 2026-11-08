import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MapPin } from "lucide-react";
import { Cabecalho } from "@/components/app/cabecalho";
import { FormInteresse } from "@/components/projeto/form-interesse";
import { LinhaDoTempo } from "@/components/projeto/linha-do-tempo";
import { SeloEstagio } from "@/components/projeto/selo-estagio";
import { Card, CardEyebrow, CardTitle } from "@/components/ui/card";
import { DemoTag } from "@/components/ui/tag";
import { exigirPapel } from "@/lib/auth/sessao";
import { obterProjeto } from "@/lib/dados";
import { infoEstagio } from "@/lib/dados/tipos";
import { ROTULO_PRATICA } from "@/lib/diagnostico/schema";
import { formatHectares, formatNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Projeto" };

export default function ProjetoPage({ params }: PageProps<"/marketplace/[id]">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-[var(--radius-card)] bg-areia" />}>
      <Conteudo params={params} />
    </Suspense>
  );
}

async function Conteudo({ params }: { params: PageProps<"/marketplace/[id]">["params"] }) {
  const { id } = await params;
  const sessao = await exigirPapel("empresa", "produtor", "admin");
  const p = await obterProjeto(sessao, id);
  if (!p) notFound();

  const dados = [
    ["Prática", ROTULO_PRATICA[p.pratica]],
    ["Área do projeto", formatHectares(p.areaHa)],
    ["Metodologia de referência", p.metodologia ?? "A definir"],
    ["Culturas", p.culturas.join(", ") || "Não informado"],
    ["Início", p.inicio ? new Date(`${p.inicio}T12:00:00`).toLocaleDateString("pt-BR") : "A definir"],
  ];

  return (
    <>
      <Cabecalho
        eyebrow="Projeto de carbono"
        titulo={p.titulo}
        descricao={
          <span className="flex items-center gap-1.5">
            <MapPin size={15} /> {p.municipio}/{p.uf} · localização aproximada
          </span>
        }
        acoes={
          <>
            <SeloEstagio estagio={p.estagio} />
            {p.isDemo && <DemoTag />}
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardEyebrow>Sobre o projeto</CardEyebrow>
            <p className="mt-3 text-tinta">{p.descricao}</p>
            {p.objetivo && <p className="mt-3 text-sm text-tinta-soft">Objetivo: {p.objetivo}</p>}
            <dl className="mt-6 grid gap-3 sm:grid-cols-2">
              {dados.map(([rotulo, valor]) => (
                <div key={rotulo} className="rounded-xl bg-areia/50 p-3">
                  <dt className="text-xs text-tinta-soft">{rotulo}</dt>
                  <dd className="text-sm font-semibold text-tinta">{valor}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card>
            <CardEyebrow>Créditos</CardEyebrow>
            {p.creditosEmitidos !== null ? (
              <p className="mt-2 font-display-soft text-3xl text-mata-900">
                {formatNumber(p.creditosEmitidos)} tCO₂e emitidos
              </p>
            ) : (
              <p className="mt-2 text-tinta">
                Nenhum crédito emitido. Este projeto está em <strong>{infoEstagio(p.estagio).rotulo.toLowerCase()}</strong>
                : qualquer potencial é estimativa até a verificação independente e a emissão por um registro
                oficial.
              </p>
            )}
          </Card>

          {p.infoComercial && (
            <Card>
              <CardEyebrow>Informações comerciais</CardEyebrow>
              <p className="mt-2 text-tinta">{p.infoComercial}</p>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {sessao.papel === "empresa" && (
            <Card className="border-mata-900/20">
              <CardTitle>Tenho interesse</CardTitle>
              <p className="mt-1 mb-4 text-sm text-tinta-soft">
                O produtor recebe sua mensagem no painel dele.
              </p>
              <FormInteresse projetoId={p.id} />
            </Card>
          )}
          <Card>
            <CardEyebrow>Rastreabilidade</CardEyebrow>
            <div className="mt-4">
              <LinhaDoTempo atual={p.estagio} eventos={p.linhaDoTempo} />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
