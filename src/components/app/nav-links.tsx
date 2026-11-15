"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Handshake, LayoutDashboard, MapPinned, ShieldCheck, Sprout, Store } from "lucide-react";
import { rotuloNovos } from "@/lib/interesses";
import { cn } from "@/lib/utils";
import type { Contadores, ItemNav } from "./navegacao";

const ICONES = {
  painel: LayoutDashboard,
  propriedade: MapPinned,
  projeto: Sprout,
  loja: Store,
  negocio: Handshake,
  admin: ShieldCheck,
};

/** O que o número significa, para o leitor de tela (o número sozinho não diz nada). */
const DESCRICAO: Record<keyof Contadores, (n: number) => string> = {
  interessesNovos: rotuloNovos,
};

export function NavLinks({ itens, contadores = {} }: { itens: ItemNav[]; contadores?: Contadores }) {
  const pathname = usePathname();
  return (
    <nav
      className="flex justify-around gap-1 sm:justify-start lg:flex-col"
      aria-label="Navegação da plataforma"
    >
      {itens.map((item) => {
        const Icone = ICONES[item.icone];
        const ativo =
          pathname === item.href ||
          (item.href !== "/produtor" && item.href !== "/empresa" && pathname.startsWith(item.href));
        const quantidade = item.contador ? (contadores[item.contador] ?? 0) : 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={ativo ? "page" : undefined}
            className={cn(
              "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors",
              ativo ? "bg-broto text-mata-900" : "text-palha/70 hover:bg-palha/10 hover:text-palha",
            )}
          >
            <Icone size={18} aria-hidden />
            {/* sr-only (e não hidden): no celular o ícone aparece sozinho, mas o leitor de tela ainda lê o nome */}
            <span className="sr-only sm:not-sr-only">{item.rotulo}</span>
            {item.contador && quantidade > 0 && (
              <Contador
                quantidade={quantidade}
                ativo={ativo}
                descricao={DESCRICAO[item.contador](quantidade)}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function Contador({
  quantidade,
  ativo,
  descricao,
}: {
  quantidade: number;
  ativo: boolean;
  descricao: string;
}) {
  return (
    <span
      className={cn(
        // Celular (só o ícone aparece): no canto do ícone. Com o nome visível: logo depois dele;
        // na barra lateral (lg), no fim da linha
        "absolute top-0.5 left-6 grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 font-mono text-[10.5px] leading-none font-bold ring-2 sm:relative sm:top-auto sm:left-auto sm:ring-0 lg:ml-auto",
        // Sempre o inverso do fundo do item, para destacar tanto no item ativo quanto no inativo
        ativo ? "bg-mata-900 text-broto ring-broto" : "bg-broto text-mata-900 ring-mata-900",
      )}
    >
      {/* key: quando o número muda o anel remonta e a animação recomeça */}
      <span
        key={quantidade}
        aria-hidden
        className="absolute inset-0 animate-chamar rounded-full bg-inherit"
      />
      <span aria-hidden className="relative">
        {quantidade > 99 ? "99+" : quantidade}
      </span>
      <span className="sr-only">{`, ${descricao}`}</span>
    </span>
  );
}
