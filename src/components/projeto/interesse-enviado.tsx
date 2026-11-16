import { retirarInteresse } from "@/app/(app)/marketplace/[id]/actions";
import { Card, CardTitle } from "@/components/ui/card";
import { ConfirmarAcao } from "@/components/ui/confirmar-acao";
import { Tag } from "@/components/ui/tag";
import { ROTULO_STATUS, type Interesse, type StatusInteresse } from "@/lib/dados/tipos";
import { estaAberto } from "@/lib/interesses";
import { formatNumber } from "@/lib/utils";

const SITUACAO: Record<StatusInteresse, string> = {
  enviada: "O produtor recebeu sua mensagem e ainda não respondeu.",
  em_negociacao: "Vocês estão em negociação.",
  aceita: "O produtor aceitou o interesse.",
  recusada: "O produtor recusou este interesse.",
  encerrada: "Esta negociação foi encerrada.",
};

const formatarData = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");

/**
 * O interesse que a empresa já enviou para o projeto (aparece no lugar do formulário:
 * o banco só aceita um por empresa e projeto). Em aberto, a empresa pode retirar.
 */
export function InteresseEnviado({ interesse: i }: { interesse: Interesse }) {
  return (
    <Card className="border-mata-900/20">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle>Seu interesse</CardTitle>
        <Tag kind="neutro">{ROTULO_STATUS[i.status]}</Tag>
      </div>
      <p className="mt-1 text-sm text-tinta-soft">{SITUACAO[i.status]}</p>
      <div className="mt-4 rounded-2xl bg-areia/50 p-4">
        <p className="text-sm text-tinta">{i.mensagem}</p>
        <p className="mt-2 text-xs text-tinta-soft">
          Enviado em {formatarData(i.criadoEm)}
          {i.volumeProposto !== null && ` · ${formatNumber(i.volumeProposto)} tCO₂e de referência`}
        </p>
      </div>
      {estaAberto(i) && (
        <div className="mt-4 flex flex-wrap justify-end">
          <ConfirmarAcao
            rotulo="Retirar interesse"
            pergunta="Retirar seu interesse? O produtor deixa de ver sua mensagem."
            confirmar="Retirar"
            executando="Retirando..."
            acao={retirarInteresse.bind(null, i.id)}
            className="hover:bg-erro/10 hover:text-erro"
          />
        </div>
      )}
    </Card>
  );
}
