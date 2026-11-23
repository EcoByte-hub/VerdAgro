"use client";

import { useActionState, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { responderInteresse } from "@/app/(app)/negociacoes/[id]/actions";
import { Button } from "@/components/ui/button";
import type { StatusInteresse } from "@/lib/dados/tipos";
import { podeResponderNegociacao } from "@/lib/negociacoes";

const DECISAO: Partial<Record<StatusInteresse, string>> = {
  aceita: "Você aceitou este interesse. A conversa continua disponível abaixo.",
  recusada: "Você recusou este interesse. O histórico da conversa continua disponível abaixo.",
  encerrada: "Esta negociação foi encerrada. O histórico continua disponível abaixo.",
};

export function RespostaNegociacao({
  interesseId,
  status,
  demo,
}: {
  interesseId: string;
  status: StatusInteresse;
  demo: boolean;
}) {
  const [estado, acao, pendente] = useActionState(responderInteresse, undefined);
  const [confirmando, setConfirmando] = useState(false);
  const recusar = useRef<HTMLButtonElement>(null);
  const cancelar = useRef<HTMLButtonElement>(null);

  if (DECISAO[status]) {
    return <p className="text-sm text-tinta-soft">{DECISAO[status]}</p>;
  }

  if (demo) {
    return (
      <p className="text-sm text-tinta-soft">
        No modo demonstração, as respostas não são registradas. Conecte o Supabase para aceitar, negociar ou
        recusar interesses.
      </p>
    );
  }

  function confirmarRecusa() {
    flushSync(() => setConfirmando(true));
    cancelar.current?.focus();
  }

  function cancelarRecusa() {
    flushSync(() => setConfirmando(false));
    recusar.current?.focus();
  }

  return (
    <form action={acao}>
      <input type="hidden" name="interesseId" value={interesseId} />
      <fieldset disabled={pendente} aria-busy={pendente}>
        <legend className="mb-2 text-sm font-semibold text-tinta">Responder interesse</legend>
        {confirmando ? (
          <div className="rounded-xl bg-erro/5 p-4">
            <p className="mb-3 text-sm text-tinta">Recusar este interesse? A empresa verá sua resposta.</p>
            <div className="flex flex-wrap gap-2">
              <Button ref={cancelar} variant="secondary" size="sm" onClick={cancelarRecusa}>
                Cancelar
              </Button>
              <Button
                type="submit"
                name="status"
                value="recusada"
                size="sm"
                className="bg-erro text-palha-50 shadow-none hover:bg-erro/90"
              >
                {pendente ? "Recusando..." : "Confirmar recusa"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button type="submit" name="status" value="aceita" size="sm">
              {pendente ? "Salvando..." : "Aceitar interesse"}
            </Button>
            {podeResponderNegociacao(status, "em_negociacao") && (
              <Button type="submit" name="status" value="em_negociacao" variant="secondary" size="sm">
                Iniciar negociação
              </Button>
            )}
            <Button
              ref={recusar}
              variant="ghost"
              size="sm"
              onClick={confirmarRecusa}
              className="hover:bg-erro/10 hover:text-erro"
            >
              Recusar interesse
            </Button>
          </div>
        )}
      </fieldset>
      {estado?.erro && (
        <p role="alert" className="mt-3 text-sm text-erro">
          {estado.erro}
        </p>
      )}
      {estado?.ok && (
        <p role="status" className="mt-3 text-sm text-musgo">
          {estado.ok}
        </p>
      )}
    </form>
  );
}
