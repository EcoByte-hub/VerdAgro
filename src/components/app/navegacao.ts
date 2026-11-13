import type { Papel } from "@/lib/auth/rotas";

export type ItemNav = {
  href: string;
  rotulo: string;
  icone: "painel" | "propriedade" | "projeto" | "loja" | "negocio" | "admin";
};

export const NAV_POR_PAPEL: Record<Papel, ItemNav[]> = {
  produtor: [
    { href: "/produtor", rotulo: "Painel", icone: "painel" },
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
