"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const POR_PAGINA = 12;
const COLUNAS = 3;
/** altura aproximada do painel, para decidir se abre para cima */
const ALTURA_PAINEL = 280;

type Props = {
  /** nome do campo no formulário; vai vazio quando nenhum ano foi escolhido */
  name: string;
  /** nome acessível do campo, ex.: "Plantio direto: ano de início" */
  rotulo: string;
  defaultValue?: number | null;
  onChange?: (ano: number | null) => void;
  min?: number;
  /** padrão: ano atual */
  max?: number;
  placeholder?: string;
  className?: string;
};

type Aberto = {
  /** último ano permitido */
  teto: number;
  /** último ano da página visível */
  fim: number;
  /** ano com foco na grade (tabindex 0) */
  focado: number;
  acima: boolean;
};

/** Páginas ancoradas no teto: a primeira mostra os 12 anos mais recentes. */
const fimDaPagina = (ano: number, teto: number) => teto - Math.floor((teto - ano) / POR_PAGINA) * POR_PAGINA;

/**
 * Seletor de ano em grade, no estilo da visão de anos de um seletor de data.
 * Não aceita digitação, então o valor é sempre um ano válido (ou vazio).
 */
export function SeletorAno({
  name,
  rotulo,
  defaultValue = null,
  onChange,
  min = 1950,
  max,
  placeholder = "Ano",
  className,
}: Props) {
  const [ano, setAno] = useState<number | null>(defaultValue);
  const [aberto, setAberto] = useState<Aberto | null>(null);
  const raiz = useRef<HTMLDivElement>(null);
  const gatilho = useRef<HTMLButtonElement>(null);
  const painel = useRef<HTMLDivElement>(null);
  /** só move o foco para a grade ao abrir ou ao navegar pelo teclado */
  const focarGrade = useRef(false);
  const idPainel = useId();
  const estaAberto = aberto !== null;

  useEffect(() => {
    if (!aberto || !focarGrade.current) return;
    focarGrade.current = false;
    painel.current?.querySelector<HTMLButtonElement>(`[data-ano="${aberto.focado}"]`)?.focus();
  }, [aberto]);

  useEffect(() => {
    if (!estaAberto) return;
    const cliqueFora = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAberto(null);
    };
    document.addEventListener("pointerdown", cliqueFora);
    return () => document.removeEventListener("pointerdown", cliqueFora);
  }, [estaAberto]);

  function abrir() {
    // O ano atual é lido só aqui (no clique), nunca durante o render no servidor
    const teto = max ?? new Date().getFullYear();
    const alvo = Math.min(Math.max(ano ?? teto, min), teto);
    const r = gatilho.current!.getBoundingClientRect();
    focarGrade.current = true;
    setAberto({
      teto,
      fim: fimDaPagina(alvo, teto),
      focado: alvo,
      acima: window.innerHeight - r.bottom < ALTURA_PAINEL && r.top > ALTURA_PAINEL,
    });
  }

  function fechar() {
    setAberto(null);
    gatilho.current?.focus();
  }

  function escolher(novo: number | null) {
    setAno(novo);
    onChange?.(novo);
    fechar();
  }

  function mudarPagina(direcao: -1 | 1) {
    if (!aberto) return;
    const fim = aberto.fim + direcao * POR_PAGINA;
    if (fim > aberto.teto || fim < min) return;
    const focado = Math.min(Math.max(aberto.focado + direcao * POR_PAGINA, min), aberto.teto);
    setAberto({ ...aberto, fim, focado });
  }

  function navegar(e: React.KeyboardEvent, atual: number) {
    const passo = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -COLUNAS, ArrowDown: COLUNAS }[e.key];
    if (!passo || !aberto) return;
    e.preventDefault();
    const focado = Math.min(Math.max(atual + passo, min), aberto.teto);
    focarGrade.current = true;
    setAberto({ ...aberto, focado, fim: fimDaPagina(focado, aberto.teto) });
  }

  const inicioPagina = aberto ? aberto.fim - POR_PAGINA + 1 : 0;
  const temAnterior = aberto ? inicioPagina > min : false;
  const temProxima = aberto ? aberto.fim < aberto.teto : false;

  return (
    <div
      ref={raiz}
      className={cn("relative", className)}
      onBlur={(e) => {
        // Fecha quando o foco sai do componente (ex.: Tab)
        if (estaAberto && !e.currentTarget.contains(e.relatedTarget as Node)) setAberto(null);
      }}
    >
      <input type="hidden" name={name} value={ano ?? ""} />
      <button
        ref={gatilho}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={estaAberto}
        aria-controls={estaAberto ? idPainel : undefined}
        aria-label={`${rotulo}, ${ano ?? "não informado"}`}
        onClick={() => (estaAberto ? setAberto(null) : abrir())}
        className={cn(
          "inline-flex w-24 items-center justify-between gap-1 rounded-lg border border-areia bg-palha px-2 py-1 text-sm transition-colors hover:border-musgo/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-broto/60",
          estaAberto && "border-musgo ring-2 ring-broto/60",
          ano === null ? "text-argila" : "font-semibold text-tinta",
        )}
      >
        {ano ?? placeholder}
        <CalendarDays size={14} className="shrink-0 text-tinta-soft" aria-hidden />
      </button>

      {aberto && (
        <div
          ref={painel}
          id={idPainel}
          role="dialog"
          aria-label={`Escolher ano: ${rotulo}`}
          // tabIndex -1: clicar no fundo do painel não tira o foco do componente
          tabIndex={-1}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              e.stopPropagation();
              fechar();
            }
          }}
          className={cn(
            "absolute right-0 z-20 w-64 rounded-2xl border border-areia bg-palha-50 p-3 shadow-[0_20px_40px_-20px_rgba(14,42,31,0.35)] focus:outline-none",
            aberto.acima ? "bottom-full mb-2" : "top-full mt-2",
          )}
        >
          <div className="flex items-center justify-between">
            <BotaoPagina rotulo="Anos anteriores" ativo={temAnterior} onClick={() => mudarPagina(-1)}>
              <ChevronLeft size={16} />
            </BotaoPagina>
            <p className="font-mono text-xs tracking-wider text-tinta-soft" aria-live="polite">
              {Math.max(inicioPagina, min)} – {aberto.fim}
            </p>
            <BotaoPagina rotulo="Próximos anos" ativo={temProxima} onClick={() => mudarPagina(1)}>
              <ChevronRight size={16} />
            </BotaoPagina>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-1">
            {Array.from({ length: POR_PAGINA }, (_, i) => inicioPagina + i).map((a) =>
              a < min ? (
                // altura fixa: o painel não encolhe (aberto para cima, as setas sairiam do lugar)
                <span key={a} aria-hidden className="h-9" />
              ) : (
                <button
                  key={a}
                  type="button"
                  data-ano={a}
                  tabIndex={a === aberto.focado ? 0 : -1}
                  aria-pressed={a === ano}
                  onClick={() => escolher(a)}
                  onKeyDown={(e) => navegar(e, a)}
                  className={cn(
                    "h-9 rounded-xl text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-broto/60",
                    a === ano ? "bg-broto font-semibold text-mata-900" : "text-tinta hover:bg-areia/70",
                    a === aberto.teto && a !== ano && "font-semibold text-musgo",
                  )}
                >
                  {a}
                </button>
              ),
            )}
          </div>

          {ano !== null && (
            <div className="mt-2 flex justify-end border-t border-areia pt-2">
              <button
                type="button"
                onClick={() => escolher(null)}
                className="rounded-lg px-2 py-1 text-xs font-semibold text-musgo hover:bg-areia/70"
              >
                Limpar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** aria-disabled em vez de disabled: um botão focado que vira disabled perde o foco e fecharia o painel */
function BotaoPagina({
  rotulo,
  ativo,
  onClick,
  children,
}: {
  rotulo: string;
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={rotulo}
      aria-disabled={!ativo}
      onClick={ativo ? onClick : undefined}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-full text-tinta-soft transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-broto/60",
        ativo ? "hover:bg-areia/70 hover:text-tinta" : "cursor-default opacity-30",
      )}
    >
      {children}
    </button>
  );
}
