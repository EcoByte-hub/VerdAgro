"use client";

import { useActionState } from "react";
import { ChevronsUp } from "lucide-react";
import { avancarEstagio, type EstadoAvancoEstagio } from "@/app/(app)/produtor/projetos/[id]/actions";
import { Button } from "@/components/ui/button";
import { FieldError, Label, Textarea } from "@/components/ui/input";
import { ESTAGIOS, type Estagio } from "@/lib/dados/tipos";
import { CheckCircle2 } from "lucide-react";

type Props = {
  projetoId: string;
  atual: Estagio;
  /** modo demonstração: o envio mostra o aviso padrão, nada é gravado */
  demo: boolean;
};

/**
 * Avança o projeto para o próximo estágio, em ordem. Estágios de verificação
 * e certificação exigem nota com a evidência (regra aplicada pela RPC do banco).
 */
export function AvancarEstagio({ projetoId, atual, demo }: Props) {
  const [estado, acao, pendente] = useActionState(avancarEstagio, undefined);
  const indice = ESTAGIOS.findIndex((e) => e.id === atual);
  const proximo = indice >= 0 ? ESTAGIOS[indice + 1] : undefined;
  if (!proximo) return null;
  const notaObrigatoria = proximo.tipo !== "estimativa";

  return (
    <form action={acao} className="mt-5 border-t border-areia pt-4">
      <input type="hidden" name="projetoId" value={projetoId} />
      <p className="text-sm font-semibold text-tinta">Avançar para {proximo.rotulo}</p>
      <p className="mt-0.5 text-xs text-tinta-soft">
        {notaObrigatoria
          ? "Este estágio exige a nota: registre quem verificou e com qual evidência."
          : "Opcional: registre uma nota sobre o que mudou."}
      </p>
      <Label htmlFor="avanco-nota" className="sr-only">
        Nota da mudança
      </Label>
      <Textarea
        id="avanco-nota"
        name="nota"
        maxLength={500}
        className="mt-2 min-h-16"
        placeholder="Ex.: Validação contratada com organismo X"
        defaultValue={estado?.valores?.nota ?? ""}
        required={notaObrigatoria}
        aria-describedby="avanco-nota-dica"
      />
      <p id="avanco-nota-dica" className="mt-1 text-xs text-tinta-soft">
        A nota fica registrada na linha do tempo, com a data da mudança.
      </p>

      <FieldError>{estado?.erro}</FieldError>
      {estado?.ok && (
        <p
          role="status"
          className="mt-2 flex items-center gap-2 rounded-2xl bg-broto/25 px-4 py-3 text-sm text-mata-900"
        >
          <CheckCircle2 size={16} className="shrink-0" /> {estado.ok}
        </p>
      )}

      <div className="mt-3 flex justify-end">
        <Button type="submit" size="sm" disabled={pendente}>
          <ChevronsUp size={14} />
          {pendente ? "Avançando..." : `Avançar para ${proximo.rotulo}`}
        </Button>
      </div>
    </form>
  );
}
