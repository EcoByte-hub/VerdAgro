"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Check, FileText, Loader2, RotateCcw, Sparkles } from "lucide-react";
import {
  executarDiagnostico,
  type RespostaDiagnostico,
} from "@/app/(app)/produtor/propriedades/[id]/actions";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { AVISO_PRELIMINAR, ROTULO_PRATICA } from "@/lib/diagnostico/schema";
import { formatNumber } from "@/lib/utils";
import { GraficoNdvi } from "./grafico-ndvi";

const ETAPAS = [
  "Lendo dados da propriedade",
  "Consultando satélite (NDVI)",
  "Cruzando dados climáticos",
  "Interpretando com IA",
];

export function PainelDiagnostico({ propriedadeId }: { propriedadeId: string }) {
  const [resposta, setResposta] = useState<RespostaDiagnostico | null>(null);
  const [pendente, iniciar] = useTransition();

  const gerar = () =>
    iniciar(async () => {
      setResposta(null);
      setResposta(await executarDiagnostico(propriedadeId));
    });

  return (
    <section
      className="overflow-hidden rounded-[var(--radius-card)] bg-mata-900 text-palha"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-mata-700 px-6 py-4">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-broto" />
          <h2 className="font-display-soft text-xl">Diagnóstico Inteligente</h2>
        </div>
        <Button onClick={gerar} disabled={pendente} size="sm">
          {pendente ? (
            <Loader2 size={16} className="animate-spin" />
          ) : resposta?.ok ? (
            <RotateCcw size={16} />
          ) : (
            <Sparkles size={16} />
          )}
          {pendente ? "Analisando..." : resposta?.ok ? "Gerar novamente" : "Gerar diagnóstico"}
        </Button>
      </div>

      <div className="p-6">
        {pendente && (
          <ul className="space-y-3 py-6">
            {ETAPAS.map((e) => (
              <li key={e} className="flex items-center gap-3 font-mono text-sm text-palha/80">
                <Loader2 size={14} className="animate-spin text-broto" /> {e}
              </li>
            ))}
          </ul>
        )}

        {!pendente && !resposta && (
          <p className="py-8 text-center text-palha/70">
            Cruze satélite, clima e IA para descobrir práticas, oportunidades e o que precisa ser comprovado.
          </p>
        )}

        {!pendente && resposta && !resposta.ok && (
          <p className="flex items-center gap-2 rounded-xl bg-erro/20 p-4 text-sm">
            <AlertTriangle size={16} /> {resposta.erro}
          </p>
        )}

        {!pendente && resposta?.ok && <Resultado r={resposta.resultado} />}
      </div>
    </section>
  );
}

function Resultado({ r }: { r: Extract<RespostaDiagnostico, { ok: true }>["resultado"] }) {
  const { diagnostico: d, indicadores: ind } = r;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Tag kind="estimativa" className="border-cerrado-300 text-cerrado-300">
          Estimativa preliminar
        </Tag>
        <Tag kind="demo" className="text-palha/70">
          Satélite: {r.origem.ndvi === "sentinel-2" ? "Sentinel-2" : "demo"} · Clima:{" "}
          {r.origem.clima === "nasa-power" ? "NASA POWER" : "demo"} · IA:{" "}
          {r.origem.ia === "claude" ? "Claude" : "demo"}
        </Tag>
      </div>

      <p className="text-lg leading-relaxed">{d.resumo}</p>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["NDVI médio", ind.ndviMedio === null ? "—" : formatNumber(ind.ndviMedio, 2)],
          ["NDVI na seca", ind.ndviSeca === null ? "—" : formatNumber(ind.ndviSeca, 2)],
          [
            "Chuva no ano",
            ind.precipitacaoAnualMm === null ? "—" : `${formatNumber(ind.precipitacaoAnualMm)} mm`,
          ],
          ["Meses secos", ind.mesesSecos ?? "—"],
        ].map(([rotulo, valor]) => (
          <div key={rotulo} className="rounded-2xl border border-mata-700 bg-mata-800 p-4">
            <p className="font-display-soft text-2xl text-broto">{valor}</p>
            <p className="mt-1 text-xs text-palha/60">{rotulo}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-mata-700 bg-mata-800/60 p-4">
        <GraficoNdvi serie={r.ndvi} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Bloco titulo="Práticas identificadas">
          {d.praticasIdentificadas.map((p) => (
            <Item key={p.pratica} marcador="solido" titulo={ROTULO_PRATICA[p.pratica]} texto={p.evidencia} />
          ))}
        </Bloco>
        <Bloco titulo="Oportunidades de melhoria">
          {d.oportunidades.map((o) => (
            <Item key={o.titulo} marcador="tracejado" titulo={o.titulo} texto={o.descricao} />
          ))}
        </Bloco>
        <Bloco titulo="Documentos necessários">
          {d.documentosNecessarios.map((doc) => (
            <Item key={doc.documento} marcador="doc" titulo={doc.documento} texto={doc.motivo} />
          ))}
        </Bloco>
        <Bloco titulo="Próximas etapas">
          {d.proximasEtapas.map((e, i) => (
            <Item key={e} marcador={i + 1} titulo={e} />
          ))}
        </Bloco>
      </div>

      {d.pontosAComprovar.length > 0 && (
        <Bloco titulo="Precisa ser comprovado">
          {d.pontosAComprovar.map((p) => (
            <Item key={p} marcador="tracejado" titulo={p} />
          ))}
        </Bloco>
      )}

      {d.alertas.length > 0 && (
        <ul className="space-y-2">
          {d.alertas.map((a) => (
            <li key={a} className="flex items-start gap-2 text-sm text-cerrado-300">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {a}
            </li>
          ))}
        </ul>
      )}

      <p className="border-t border-mata-700 pt-4 text-xs leading-relaxed text-palha/50">
        {AVISO_PRELIMINAR}
      </p>
    </div>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-mata-700 bg-mata-800/60 p-4">
      <p className="text-sm font-semibold text-palha/90">{titulo}</p>
      <ul className="mt-3 space-y-3">{children}</ul>
    </div>
  );
}

function Item({
  marcador,
  titulo,
  texto,
}: {
  marcador: "solido" | "tracejado" | "doc" | number;
  titulo: string;
  texto?: string;
}) {
  return (
    <li className="flex gap-3 text-sm">
      {marcador === "solido" && (
        <span className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-broto text-mata-900">
          <Check size={10} strokeWidth={3.5} />
        </span>
      )}
      {marcador === "tracejado" && (
        <span className="mt-0.5 size-4 shrink-0 rounded-full border border-dashed border-cerrado-300" />
      )}
      {marcador === "doc" && <FileText size={16} className="mt-0.5 shrink-0 text-palha/50" />}
      {typeof marcador === "number" && (
        <span className="mt-px w-4 shrink-0 font-mono text-xs text-broto">{marcador}.</span>
      )}
      <span>
        <span className="text-palha">{titulo}</span>
        {texto && <span className="mt-0.5 block text-palha/60">{texto}</span>}
      </span>
    </li>
  );
}
