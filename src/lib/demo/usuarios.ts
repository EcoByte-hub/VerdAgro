import type { Papel } from "@/lib/auth/rotas";

/** Usuários DEMONSTRATIVOS (mesmos IDs do supabase/seed.sql). Senha no seed: verdagro-demo */
export const USUARIOS_DEMO: Record<Papel, { id: string; email: string; nome: string; organizacao: string }> =
  {
    produtor: {
      id: "11111111-1111-4111-8111-111111111111",
      email: "produtor@demo.verdagro.app",
      nome: "João Ferreira",
      organizacao: "Fazenda Boa Vista",
    },
    empresa: {
      id: "33333333-3333-4333-8333-333333333333",
      email: "empresa@demo.verdagro.app",
      nome: "Marina Costa",
      organizacao: "Grupo Alimentos Horizonte",
    },
    admin: {
      id: "44444444-4444-4444-8444-444444444444",
      email: "admin@demo.verdagro.app",
      nome: "Equipe EcoByte",
      organizacao: "VerdAgro",
    },
  };
