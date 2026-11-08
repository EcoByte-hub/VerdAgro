import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { buttonClasses } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";

export default function Home() {
  return (
    <main className="relative flex flex-1 flex-col overflow-hidden">
      <div className="bg-grid pointer-events-none absolute inset-0 text-mata-900 opacity-[0.04]" aria-hidden />
      <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-10">
        <Logo />
        <div className="flex flex-1 flex-col justify-center py-16">
          <p className="eyebrow text-musgo">Plataforma · MVP</p>
          <h1 className="font-display-soft mt-5 max-w-3xl text-5xl leading-[1.02] text-mata-900 sm:text-7xl">
            Do campo ao <em className="font-light text-musgo">crédito de carbono.</em>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-tinta-soft">
            Inteligência ambiental e marketplace que conecta produtores rurais a empresas compradoras.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/entrar" className={buttonClasses({ size: "lg" })}>
              Entrar na plataforma <ArrowRight size={18} />
            </Link>
          </div>
          <div className="mt-12 flex flex-wrap gap-2">
            <Tag kind="estimativa">Estimativa</Tag>
            <Tag kind="verificacao">Em verificação</Tag>
            <Tag kind="certificado">Certificado</Tag>
          </div>
        </div>
      </div>
    </main>
  );
}
