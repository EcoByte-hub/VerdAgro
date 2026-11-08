export type Papel = "produtor" | "empresa" | "admin";

/** Área inicial de cada papel. */
export const HOME_DO_PAPEL: Record<Papel, string> = {
  produtor: "/produtor",
  empresa: "/empresa",
  admin: "/admin",
};

/** Prefixos de rota protegidos e quem pode acessá-los. */
export const ROTAS_PROTEGIDAS: { prefixo: string; papeis: Papel[] }[] = [
  { prefixo: "/produtor", papeis: ["produtor"] },
  { prefixo: "/empresa", papeis: ["empresa"] },
  { prefixo: "/marketplace", papeis: ["empresa", "produtor", "admin"] },
  { prefixo: "/admin", papeis: ["admin"] },
];

export function regraDaRota(pathname: string) {
  return ROTAS_PROTEGIDAS.find((r) => pathname === r.prefixo || pathname.startsWith(`${r.prefixo}/`));
}

/** Cookie usado no MODO DEMONSTRAÇÃO (sem Supabase configurado). */
export const COOKIE_DEMO = "verdagro_demo_papel";
