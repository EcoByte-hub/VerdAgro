"use client";

import { useId, useRef, useState } from "react";
import { MapPin, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type LocalEncontrado = {
  nome: string;
  detalhe: string;
  /** [oeste, sul, leste, norte] */
  limites: [number, number, number, number];
};

type RespostaNominatim = { display_name: string; boundingbox: [string, string, string, string] }[];

/**
 * Busca de município/endereço para centralizar o mapa (Nominatim, OpenStreetMap).
 * A política de uso do Nominatim pede no máximo 1 requisição por segundo e nada de
 * autocompletar: a busca só roda quando a pessoa confirma.
 */
export function BuscaLocal({ onEscolher }: { onEscolher: (local: LocalEncontrado) => void }) {
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState<LocalEncontrado[] | null>(null);
  const [estado, setEstado] = useState<"parado" | "buscando" | "erro">("parado");
  const pedido = useRef<AbortController | null>(null);
  const campo = useRef<HTMLInputElement>(null);
  const idCampo = useId();

  async function buscar() {
    const q = texto.trim();
    if (q.length < 3) return;
    pedido.current?.abort();
    const controle = new AbortController();
    pedido.current = controle;
    setEstado("buscando");
    try {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.search = new URLSearchParams({
        q,
        format: "jsonv2",
        countrycodes: "br",
        limit: "5",
        "accept-language": "pt-BR",
      }).toString();
      const resposta = await fetch(url, { signal: controle.signal });
      if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
      const dados = (await resposta.json()) as RespostaNominatim;
      setResultados(
        dados.map((d) => {
          const [nome, ...resto] = d.display_name.split(", ");
          const [sul, norte, oeste, leste] = d.boundingbox.map(Number);
          return { nome, detalhe: resto.slice(0, 3).join(", "), limites: [oeste, sul, leste, norte] };
        }),
      );
      setEstado("parado");
    } catch (e) {
      if ((e as Error).name !== "AbortError") setEstado("erro");
    }
  }

  function limparBusca() {
    pedido.current?.abort();
    setTexto("");
    setResultados(null);
    setEstado("parado");
    campo.current?.focus();
  }

  function escolher(local: LocalEncontrado) {
    onEscolher(local);
    setResultados(null);
    setTexto(local.nome);
  }

  const aberto = resultados !== null || estado === "erro";

  return (
    <div className="relative p-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <label htmlFor={idCampo} className="sr-only">
            Buscar município ou endereço
          </label>
          <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-argila" aria-hidden />
          {/* sem name: não vai junto com o formulário da propriedade */}
          <input
            ref={campo}
            id={idCampo}
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
              setResultados(null);
              if (estado === "erro") setEstado("parado");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault(); // Enter aqui enviaria o cadastro da propriedade
                void buscar();
              } else if (e.key === "Escape" && aberto) {
                e.preventDefault();
                setResultados(null);
              }
            }}
            placeholder="Município ou endereço"
            // Esconde o "x" nativo do type="search" (Chrome/Safari): o botão abaixo segue o visual da página
            className="h-11 w-full rounded-xl border border-palha/20 bg-palha-50 pr-10 pl-9 text-[15px] text-tinta placeholder:text-argila focus:border-broto focus:ring-2 focus:ring-broto/60 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {texto && (
            <button
              type="button"
              aria-label="Limpar busca"
              onClick={limparBusca}
              // altura do campo inteira: alvo de toque de 44 px, só o ícone aparece
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-xl text-argila transition-colors hover:text-tinta focus-visible:text-tinta focus-visible:outline-none"
            >
              <X size={16} aria-hidden />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => void buscar()}
          disabled={estado === "buscando" || texto.trim().length < 3}
          className="h-11 shrink-0 rounded-xl bg-palha/10 px-4 text-sm font-semibold text-palha transition-colors hover:bg-palha/20 disabled:opacity-50"
        >
          {estado === "buscando" ? "Buscando..." : "Buscar"}
        </button>
      </div>

      {aberto && (
        <div className="absolute inset-x-3 top-full z-10 -mt-1 overflow-hidden rounded-2xl border border-areia bg-palha-50 shadow-[0_20px_40px_-20px_rgba(14,42,31,0.5)]">
          {estado === "erro" ? (
            <p className="px-4 py-3 text-sm text-erro">Não foi possível buscar agora. Tente de novo.</p>
          ) : resultados?.length ? (
            <ul aria-label="Locais encontrados">
              {resultados.map((r, i) => (
                <li key={`${r.nome}-${i}`}>
                  <button
                    type="button"
                    onClick={() => escolher(r)}
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-areia/70 focus:bg-areia/70 focus:outline-none",
                      i > 0 && "border-t border-areia",
                    )}
                  >
                    <MapPin size={16} className="mt-0.5 shrink-0 text-musgo" aria-hidden />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-tinta">{r.nome}</span>
                      <span className="block truncate text-xs text-tinta-soft">{r.detalhe}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-3 text-sm text-tinta-soft">Nada encontrado para “{texto.trim()}”.</p>
          )}
          <p className="border-t border-areia px-4 py-1.5 text-[10px] text-argila">
            Busca: © colaboradores do OpenStreetMap
          </p>
        </div>
      )}
    </div>
  );
}
