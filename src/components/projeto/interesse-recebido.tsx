import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { recusarInteresse } from "@/app/(app)/produtor/projetos/[id]/actions";
import { ConfirmarAcao } from "@/components/ui/confirmar-acao";
import { Tag } from "@/components/ui/tag";
import { ROTULO_STATUS, type Interesse } from "@/lib/dados/tipos";
import { ehNovo, estaAberto } from "@/lib/interesses";
import { cn, formatNumber } from "@/lib/utils";

const formatarData = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");

/**
 * Interesse de uma empresa, na visão do produtor. O que ainda não teve resposta
 * (status "enviada") aparece como "Novo", com fundo e faixa lateral de destaque.
 * Enquanto está em aberto, o produtor pode recusar.
 */
export function InteresseRecebido({
  interesse: i,
  mostrarProjeto = false,
}: {
  interesse: Interesse;
  /** no painel, que junta todos os projetos: diz de qual projeto é e leva até ele */
  mostrarProjeto?: boolean;
}) {
  const novo = ehNovo(i);
  const empresa = i.contraparte ?? "esta empresa";
  return (
    <article
      className={cn(
        "rounded-2xl border p-4",
        novo
          ? "border-broto-700/50 bg-broto/25 shadow-[inset_4px_0_0_var(--color-broto-700)]"
          : "border-areia bg-palha-50",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-tinta">{i.contraparte ?? "Empresa"}</p>
        {/* "Enviada" é o ponto de vista da empresa; para quem recebe, é novo */}
        {novo ? <Tag kind="novo">Novo</Tag> : <Tag kind="neutro">{ROTULO_STATUS[i.status]}</Tag>}
      </div>
      {mostrarProjeto && <p className="mt-0.5 text-xs text-tinta-soft">{i.projetoTitulo}</p>}
      <p className="mt-2 text-sm text-tinta">{i.mensagem}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="mr-auto text-xs text-tinta-soft">
          Recebido em {formatarData(i.criadoEm)}
          {i.volumeProposto !== null && ` · ${formatNumber(i.volumeProposto)} tCO₂e de referência`}
        </p>
        {estaAberto(i) && (
          <ConfirmarAcao
            rotulo="Recusar"
            rotuloAcessivel={`Recusar o interesse de ${empresa}`}
            pergunta={`Recusar o interesse de ${empresa}? A empresa verá o interesse como recusado.`}
            confirmar="Recusar"
            executando="Recusando..."
            acao={recusarInteresse.bind(null, i.id)}
            className="-my-1 px-3 hover:bg-erro/10 hover:text-erro"
          />
        )}
        {mostrarProjeto && (
          <Link
            href={`/produtor/projetos/${i.projetoId}`}
            className="flex items-center gap-1 text-sm font-semibold text-musgo underline-offset-4 hover:underline"
          >
            Ver projeto <span className="sr-only">{i.projetoTitulo}</span>
            <ArrowUpRight size={16} aria-hidden />
          </Link>
        )}
      </div>
    </article>
  );
}
