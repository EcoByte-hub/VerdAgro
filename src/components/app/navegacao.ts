import type { Papel } from "@/lib/auth/rotas";

/** Números mostrados ao lado de itens do menu (só os maiores que zero aparecem). */
export type Contadores = { interessesNovos?: number };

export type ItemNav = {
  href: string;
  rotulo: string;
  icone: "painel" | "propriedade" | "projeto" | "loja" | "negocio" | "admin";
  contador?: keyof Contadores;
};

export const NAV_POR_PAPEL: Record<Papel, ItemNav[]> = {
  produtor: [
    // Os interesses recebidos aparecem no topo do painel
    { href: "/produtor", rotulo: "Painel", icone: "painel", contador: "interessesNovos" },
    { href: "/produtor/projetos", rotulo: "Meus projetos", icone: "projeto" },
    { href: "/produtor/propriedades/nova", rotulo: "Nova propriedade", icone: "propriedade" },
    { href: "/marketplace", rotulo: "Marketplace", icone: "loja" },
  ],
  empresa: [
    { href: "/empresa", rotulo: "Painel", icone: "painel" },
    { href: "/marketplace", rotulo: "Marketplace", icone: "loja" },
  ],
  admin: [
    { href: "/admin", rotulo: "Administração", icone: "admin" },
    { href: "/marketplace", rotulo: "Marketplace", icone: "loja" },
  ],
};

export const ROTULO_PAPEL: Record<Papel, string> = {
  produtor: "Produtor rural",
  empresa: "Empresa compradora",
  admin: "Administrador",
};
