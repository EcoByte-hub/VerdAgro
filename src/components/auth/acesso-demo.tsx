import { Building2, ShieldCheck, Tractor } from "lucide-react";
import { entrarDemo } from "@/app/(auth)/actions";
import { Tag } from "@/components/ui/tag";

const OPCOES = [
  { papel: "produtor", titulo: "Produtor rural", desc: "João · Fazenda Boa Vista (200 ha)", Icon: Tractor },
  {
    papel: "empresa",
    titulo: "Empresa compradora",
    desc: "Marina · Grupo Alimentos Horizonte",
    Icon: Building2,
  },
  { papel: "admin", titulo: "Administrador", desc: "Equipe EcoByte", Icon: ShieldCheck },
] as const;

/** Acesso rápido do MODO DEMONSTRAÇÃO (sem Supabase configurado). */
export function AcessoDemo() {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-argila bg-palha-50 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-tinta">Entrar como usuário de demonstração</p>
        <Tag kind="demo">Demo</Tag>
      </div>
      <div className="mt-4 grid gap-2">
        {OPCOES.map(({ papel, titulo, desc, Icon }) => (
          <form key={papel} action={entrarDemo.bind(null, papel)}>
            <button
              type="submit"
              className="group flex w-full items-center gap-3 rounded-2xl border border-areia bg-palha px-4 py-3 text-left transition-colors hover:border-mata-900 hover:bg-mata-900"
            >
              <span className="inline-flex size-9 items-center justify-center rounded-xl bg-mata-900 text-broto transition-colors group-hover:bg-broto group-hover:text-mata-900">
                <Icon size={18} />
              </span>
              <span>
                <span className="block text-sm font-semibold text-tinta group-hover:text-palha">
                  {titulo}
                </span>
                <span className="block text-xs text-tinta-soft group-hover:text-palha/70">{desc}</span>
              </span>
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
