import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-mata-900 p-12 text-palha lg:flex lg:flex-col">
        <div className="pointer-events-none absolute inset-0 bg-grid text-palha opacity-[0.05]" aria-hidden />
        <div
          className="pointer-events-none absolute -right-40 -bottom-40 size-[520px] rounded-full bg-broto/15 blur-[120px]"
          aria-hidden
        />
        <Link href="/" className="relative">
          <Logo variant="negative" />
        </Link>
        <div className="relative mt-auto">
          <p className="eyebrow text-broto">Inteligência ambiental</p>
          <p className="mt-5 font-display-soft text-5xl leading-[1.05]">
            Do campo ao <em className="font-light text-broto">crédito de carbono.</em>
          </p>
          <p className="mt-6 max-w-md text-palha/70">
            Diagnóstico da propriedade com satélite e IA, projetos rastreáveis e conexão direta com empresas
            compradoras.
          </p>
        </div>
      </aside>
      <main className="flex flex-col px-6 py-10 sm:px-12">
        <Link href="/" className="lg:hidden">
          <Logo />
        </Link>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">{children}</div>
      </main>
    </div>
  );
}
