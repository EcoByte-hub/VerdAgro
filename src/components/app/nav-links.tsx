"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Handshake, LayoutDashboard, MapPinned, ShieldCheck, Sprout, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ItemNav } from "./navegacao";

const ICONES = {
  painel: LayoutDashboard,
  propriedade: MapPinned,
  projeto: Sprout,
  loja: Store,
  negocio: Handshake,
  admin: ShieldCheck,
};

export function NavLinks({ itens }: { itens: ItemNav[] }) {
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
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={ativo ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors",
              ativo ? "bg-broto text-mata-900" : "text-palha/70 hover:bg-palha/10 hover:text-palha",
            )}
          >
            <Icone size={18} aria-hidden />
            {/* sr-only (e não hidden): no celular o ícone aparece sozinho, mas o leitor de tela ainda lê o nome */}
            <span className="sr-only sm:not-sr-only">{item.rotulo}</span>
          </Link>
        );
      })}
    </nav>
  );
}
