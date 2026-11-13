import Link from "next/link";
import { LogOut } from "lucide-react";
import { sair } from "@/app/(auth)/actions";
import { Logo } from "@/components/brand/logo";
import { Tag } from "@/components/ui/tag";
import { HOME_DO_PAPEL } from "@/lib/auth/rotas";
import { obterSessao } from "@/lib/auth/sessao";
import { redirect } from "next/navigation";
import { NAV_POR_PAPEL, ROTULO_PAPEL } from "./navegacao";
import { NavLinks } from "./nav-links";

/** Estrutura da área logada: barra lateral (desktop) / barra superior (mobile). */
export async function Shell({ children }: { children: React.ReactNode }) {
  const sessao = await obterSessao();
  if (!sessao) redirect("/entrar");

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Abaixo de lg a navegação desce para uma segunda linha: logo + 4 itens não cabem lado a lado no celular */}
      <aside className="sticky top-0 z-30 flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-mata-900 px-4 py-3 text-palha lg:h-screen lg:w-64 lg:flex-col lg:flex-nowrap lg:items-stretch lg:justify-start lg:px-5 lg:py-6">
        <Link href={HOME_DO_PAPEL[sessao.papel]} className="shrink-0">
          <Logo variant="negative" />
        </Link>
        <div className="order-last basis-full lg:order-none lg:mt-10 lg:flex-1 lg:basis-auto">
          <NavLinks itens={NAV_POR_PAPEL[sessao.papel]} />
        </div>
        <div className="flex items-center gap-2 lg:mt-auto lg:flex-col lg:items-stretch lg:gap-3 lg:border-t lg:border-mata-700 lg:pt-5">
          <div className="hidden lg:block">
            <p className="text-sm font-semibold">{sessao.nome}</p>
            <p className="text-xs text-palha/60">{sessao.organizacao ?? ROTULO_PAPEL[sessao.papel]}</p>
            {sessao.modo === "demo" && (
              <Tag kind="demo" className="mt-2 text-palha/70">
                Modo demonstração
              </Tag>
            )}
          </div>
          <form action={sair}>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-palha/70 hover:bg-palha/10 hover:text-palha"
            >
              <LogOut size={16} aria-hidden /> <span className="sr-only sm:not-sr-only">Sair</span>
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 px-4 py-8 sm:px-8 lg:px-12 lg:py-10">{children}</main>
    </div>
  );
}

export function ShellCarregando() {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <div className="h-16 bg-mata-900 lg:h-screen lg:w-64" />
      <div className="flex-1 p-12">
        <div className="h-10 w-72 animate-pulse rounded-xl bg-areia" />
      </div>
    </div>
  );
}
