/**
 * Leitura centralizada das variáveis de ambiente.
 * Cada integração é opcional: sem a variável, o app usa dados de reserva
 * (MODO DEMONSTRAÇÃO, ver docs/adr/0006-modo-demonstracao.md).
 */

const value = (name: string) => {
  const v = process.env[name];
  return v && v.trim() !== "" ? v.trim() : undefined;
};

export const env = {
  supabaseUrl: value("NEXT_PUBLIC_SUPABASE_URL"),
  supabasePublishableKey: value("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  cdseClientId: value("CDSE_CLIENT_ID"),
  cdseClientSecret: value("CDSE_CLIENT_SECRET"),
  anthropicApiKey: value("ANTHROPIC_API_KEY"),
  anthropicModel: value("ANTHROPIC_MODEL") ?? "claude-opus-5-5",
};

export const integrations = {
  get supabase() {
    return Boolean(env.supabaseUrl && env.supabasePublishableKey);
  },
  get satelite() {
    return Boolean(env.cdseClientId && env.cdseClientSecret);
  },
  get ia() {
    return Boolean(env.anthropicApiKey);
  },
};
