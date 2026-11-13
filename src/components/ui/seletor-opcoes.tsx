"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { FIELD } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type Opcao = {
  valor: string;
  rotulo: string;
  /** código curto mostrado antes do rótulo na lista e no lugar dele no campo (ex.: "GO") */
  sigla?: string;
};

type Props = {
  /** id do botão, para o <Label htmlFor> */
  id?: string;
  name: string;
  /** nome acessível do campo, ex.: "UF" */
  rotulo: string;
  opcoes: Opcao[];
  defaultValue?: string | null;
  onChange?: (valor: string) => void;
  placeholder?: string;
  required?: boolean;
  mensagemObrigatorio?: string;
  /** mostra um campo de busca no topo da lista */
  buscavel?: boolean;
  placeholderBusca?: string;
  /** lado em que o painel se alinha ao campo (use "fim" para campos estreitos à direita) */
  alinhar?: "inicio" | "fim";
  className?: string;
};

/** altura aproximada do painel (busca + lista max-h-80), para decidir se abre para cima */
const ALTURA_PAINEL = 380;

const normalizar = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

/** Filtra ignorando acentos; sigla exata e começo do nome vêm primeiro. */
function filtrar(opcoes: Opcao[], busca: string) {
  const q = normalizar(busca);
  if (!q) return opcoes;
  const pontuar = (o: Opcao) => {
    const sigla = normalizar(o.sigla ?? "");
    const rotulo = normalizar(o.rotulo);
    if (sigla === q) return 0;
    if (rotulo.startsWith(q)) return 1;
    if (sigla.startsWith(q)) return 2;
    if (rotulo.split(" ").some((palavra) => palavra.startsWith(q))) return 3;
    if (rotulo.includes(q)) return 4;
    return -1;
  };
  return opcoes
    .map((o) => ({ o, nota: pontuar(o) }))
    .filter(({ nota }) => nota >= 0)
    .sort((a, b) => a.nota - b.nota)
    .map(({ o }) => o);
}

/**
 * Select com o visual da plataforma: lista em painel, busca opcional e
 * navegação por teclado (padrão combobox/listbox da WAI-ARIA).
 */
export function SeletorOpcoes({
  id,
  name,
  rotulo,
  opcoes,
  defaultValue = null,
  onChange,
  placeholder = "Selecione",
  required = false,
  mensagemObrigatorio = "Campo obrigatório",
  buscavel = false,
  placeholderBusca = "Buscar",
  alinhar = "inicio",
  className,
}: Props) {
  /** "" = nenhum valor (é o que vai no formulário) */
  const [valor, setValor] = useState(defaultValue ?? "");
  const [aberto, setAberto] = useState<{ acima: boolean } | null>(null);
  const [busca, setBusca] = useState("");
  const [ativo, setAtivo] = useState<string | null>(null);
  const [invalido, setInvalido] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const gatilho = useRef<HTMLButtonElement>(null);
  const campoBusca = useRef<HTMLInputElement>(null);
  const lista = useRef<HTMLUListElement>(null);
  const base = useId();
  const idLista = `${base}-lista`;
  const idErro = `${base}-erro`;
  const idOpcao = (v: string) => `${base}-op-${v}`;
  const estaAberto = aberto !== null;

  const filtradas = useMemo(() => filtrar(opcoes, busca), [opcoes, busca]);
  const selecionada = (valor && opcoes.find((o) => o.valor === valor)) || null;
  // O destaque sempre aponta para uma opção visível (a busca pode esconder a anterior)
  const destaque = filtradas.some((o) => o.valor === ativo) ? ativo : (filtradas[0]?.valor ?? null);

  useEffect(() => {
    if (!estaAberto) return;
    // No celular, focar a busca abriria o teclado por cima da lista: foca a lista
    const toque = window.matchMedia("(pointer: coarse)").matches;
    if (buscavel && !toque && campoBusca.current) {
      const campo = campoBusca.current;
      campo.focus();
      campo.setSelectionRange(campo.value.length, campo.value.length);
    } else {
      lista.current?.focus();
    }
  }, [estaAberto, buscavel]);

  useEffect(() => {
    if (estaAberto && destaque !== null)
      document.getElementById(`${base}-op-${destaque}`)?.scrollIntoView({ block: "nearest" });
  }, [estaAberto, destaque, base]);

  useEffect(() => {
    if (!estaAberto) return;
    const cliqueFora = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAberto(null);
    };
    document.addEventListener("pointerdown", cliqueFora);
    return () => document.removeEventListener("pointerdown", cliqueFora);
  }, [estaAberto]);

  function abrir(buscaInicial = "") {
    const r = gatilho.current!.getBoundingClientRect();
    setBusca(buscaInicial);
    setAtivo(valor);
    setAberto({ acima: window.innerHeight - r.bottom < ALTURA_PAINEL && r.top > ALTURA_PAINEL });
  }

  function fechar() {
    setAberto(null);
    gatilho.current?.focus();
  }

  function escolher(opcao: Opcao) {
    setValor(opcao.valor);
    setInvalido(false);
    onChange?.(opcao.valor);
    fechar();
  }

  function teclar(e: React.KeyboardEvent) {
    const i = filtradas.findIndex((o) => o.valor === destaque);
    const mover = (n: number) => {
      const alvo = filtradas[Math.min(Math.max(n, 0), filtradas.length - 1)];
      if (alvo) setAtivo(alvo.valor);
    };
    const naLista = e.currentTarget === lista.current;

    if (e.key === "ArrowDown") mover(i + 1);
    else if (e.key === "ArrowUp") mover(i - 1);
    else if (e.key === "Home" && naLista) mover(0);
    else if (e.key === "End" && naLista) mover(filtradas.length - 1);
    else if (e.key === "Enter" || (e.key === " " && naLista)) {
      // Enter dentro de um <form> enviaria o formulário
      if (filtradas[i]) escolher(filtradas[i]);
    } else if (e.key === "Escape") {
      e.stopPropagation();
      fechar();
    } else return;
    e.preventDefault();
  }

  return (
    <div
      ref={raiz}
      className={cn("relative", className)}
      onBlur={(e) => {
        // Fecha quando o foco sai do componente (ex.: Tab)
        if (estaAberto && !e.currentTarget.contains(e.relatedTarget as Node)) setAberto(null);
      }}
    >
      {/* Campo real do formulário. Não é hidden nem readOnly para o navegador validar o required. */}
      <input
        tabIndex={-1}
        aria-hidden
        name={name}
        value={valor}
        onChange={() => {}}
        required={required}
        onInvalid={(e) => {
          e.preventDefault(); // troca o balão do navegador pelo estado de erro do próprio campo
          setInvalido(true);
          gatilho.current?.focus();
        }}
        className="sr-only"
      />

      <button
        ref={gatilho}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={estaAberto}
        aria-controls={estaAberto ? idLista : undefined}
        // aria-invalid não vale em button: o erro é anunciado pela mensagem ligada aqui
        aria-describedby={invalido ? idErro : undefined}
        aria-label={`${rotulo}: ${selecionada?.rotulo ?? "nenhum selecionado"}`}
        onClick={() => (estaAberto ? setAberto(null) : abrir())}
        onKeyDown={(e) => {
          if (estaAberto) return;
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            abrir();
          } else if (
            buscavel &&
            e.key.length === 1 &&
            e.key !== " " &&
            !e.ctrlKey &&
            !e.metaKey &&
            !e.altKey
          ) {
            // Digitar com o campo fechado já abre filtrando ("g" → Goiás)
            e.preventDefault();
            abrir(e.key);
          }
        }}
        className={cn(
          FIELD,
          "flex items-center justify-between gap-2 text-left",
          invalido && "border-erro",
          estaAberto && "border-musgo ring-2 ring-broto/60",
        )}
      >
        <span className={cn("truncate", !selecionada && "text-argila")}>
          {selecionada ? (selecionada.sigla ?? selecionada.rotulo) : placeholder}
        </span>
        <ChevronDown
          size={16}
          aria-hidden
          className={cn("shrink-0 text-tinta-soft transition-transform", estaAberto && "rotate-180")}
        />
      </button>
      {invalido && (
        <p id={idErro} className="mt-1.5 text-xs text-erro">
          {mensagemObrigatorio}
        </p>
      )}

      {aberto && (
        <div
          className={cn(
            "absolute z-20 w-64 min-w-full overflow-hidden rounded-2xl border border-areia bg-palha-50 shadow-[0_20px_40px_-20px_rgba(14,42,31,0.35)]",
            alinhar === "fim" ? "right-0" : "left-0",
            aberto.acima ? "bottom-full mb-2" : "top-full mt-2",
          )}
        >
          {buscavel && (
            <div className="flex items-center gap-2 border-b border-areia px-3">
              <Search size={15} className="shrink-0 text-tinta-soft" aria-hidden />
              <input
                ref={campoBusca}
                type="text"
                role="combobox"
                aria-expanded
                aria-controls={idLista}
                aria-autocomplete="list"
                aria-activedescendant={destaque !== null ? idOpcao(destaque) : undefined}
                aria-label={placeholderBusca}
                placeholder={placeholderBusca}
                autoComplete="off"
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setAtivo(null);
                }}
                onKeyDown={teclar}
                className="h-11 w-full bg-transparent text-sm text-tinta placeholder:text-argila focus:outline-none"
              />
            </div>
          )}

          <ul
            ref={lista}
            id={idLista}
            role="listbox"
            aria-label={rotulo}
            // -1: recebe foco por código (celular/sem busca) e ao clicar numa opção, sem entrar no Tab
            tabIndex={-1}
            aria-activedescendant={destaque !== null ? idOpcao(destaque) : undefined}
            onKeyDown={teclar}
            // max-h-80: cabem 8 opções sem rolagem (ex.: "Todas" + as 7 práticas)
            className="max-h-80 overflow-y-auto p-1.5 empty:hidden focus:outline-none"
          >
            {filtradas.map((o) => (
              <li
                key={o.valor}
                id={idOpcao(o.valor)}
                role="option"
                aria-selected={o.valor === valor}
                onPointerMove={() => o.valor !== destaque && setAtivo(o.valor)}
                onClick={() => escolher(o)}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm text-tinta",
                  o.valor === destaque && "bg-areia/70",
                  o.valor === valor && "font-semibold",
                )}
              >
                {o.sigla && <span className="w-6 shrink-0 font-mono text-xs text-tinta-soft">{o.sigla}</span>}
                <span className="flex-1 truncate">{o.rotulo}</span>
                {o.valor === valor && <Check size={15} className="shrink-0 text-musgo" aria-hidden />}
              </li>
            ))}
          </ul>
          {filtradas.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-tinta-soft">Nada encontrado para “{busca}”.</p>
          )}
        </div>
      )}
    </div>
  );
}
