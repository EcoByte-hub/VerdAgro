import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { DemoTag, Tag } from "@/components/ui/tag";
import { ROTULO_PRATICA } from "@/lib/diagnostico/schema";
import type { ProjetoResumo } from "@/lib/dados/tipos";
import { rotuloNovos } from "@/lib/interesses";
import { cn, formatHectares } from "@/lib/utils";
import { SeloEstagio } from "./selo-estagio";

export function CardProjeto({
  projeto,
  href,
  mostrarPublicacao = false,
  interessesNovos = 0,
}: {
  projeto: ProjetoResumo;
  href: string;
  /** visão do dono: indica se o projeto está no marketplace */
  mostrarPublicacao?: boolean;
  /** visão do dono: interesses de empresas ainda sem resposta */
  interessesNovos?: number;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex h-full flex-col rounded-[var(--radius-card)] border border-areia bg-palha-50 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-mata-900/30 hover:shadow-[0_20px_40px_-24px_rgba(14,42,31,0.35)]",
        interessesNovos > 0 && "border-broto-700/50",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <SeloEstagio estagio={projeto.estagio} />
        {mostrarPublicacao && <Tag kind="neutro">{projeto.publicado ? "Publicado" : "Não publicado"}</Tag>}
        {projeto.isDemo && <DemoTag />}
      </div>
      <h3 className="mt-4 font-display-soft text-xl text-mata-900">{projeto.titulo}</h3>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-tinta-soft">
        <MapPin size={14} /> {projeto.municipio}/{projeto.uf}
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl bg-areia/50 p-2.5">
          <dt className="text-tinta-soft">Prática</dt>
          <dd className="font-semibold text-tinta">{ROTULO_PRATICA[projeto.pratica]}</dd>
        </div>
        <div className="rounded-xl bg-areia/50 p-2.5">
          <dt className="text-tinta-soft">Área</dt>
          <dd className="font-semibold text-tinta">{formatHectares(projeto.areaHa)}</dd>
        </div>
      </dl>
      {/* O aviso de interesse fica no rodapé: entre os selos do topo ele quebrava a linha em três */}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-5">
        <span className="flex items-center gap-1 text-sm font-semibold text-musgo">
          Ver projeto{" "}
          <ArrowUpRight
            size={16}
            className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </span>
        {interessesNovos > 0 && <Tag kind="novo">{rotuloNovos(interessesNovos)}</Tag>}
      </div>
    </Link>
  );
}
