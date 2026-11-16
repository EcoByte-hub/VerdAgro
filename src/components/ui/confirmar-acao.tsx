"use client";

import { useRef, useState, useTransition } from "react";
import { flushSync } from "react-dom";
import { Button } from "@/components/ui/button";

/**
 * Botão para ação que não se desfaz pelo app: pede confirmação na própria linha (sem modal).
 * `acao` costuma ser uma server action com os argumentos presos via bind, no servidor.
 * O foco vai para a confirmação ao abrir e volta ao botão ao cancelar (teclado/leitor de tela).
 */
export function ConfirmarAcao({
  rotulo,
  rotuloAcessivel,
  pergunta,
  confirmar,
  executando,
  acao,
  className,
}: {
  rotulo: string;
  /** quando há vários botões iguais na tela, diz a qual item este se refere */
  rotuloAcessivel?: string;
  pergunta: React.ReactNode;
  /** texto do botão que confirma, ex.: "Recusar" */
  confirmar: string;
  /** texto enquanto a ação roda, ex.: "Recusando..." */
  executando: string;
  acao: () => Promise<{ erro?: string } | undefined>;
  /** classes do botão inicial */
  className?: string;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();
  const gatilho = useRef<HTMLButtonElement>(null);
  const cancelar = useRef<HTMLButtonElement>(null);

  // flushSync: o elemento precisa existir no DOM antes de receber o foco
  const abrir = () => {
    flushSync(() => setConfirmando(true));
    cancelar.current?.focus();
  };
  const fechar = () => {
    flushSync(() => {
      setConfirmando(false);
      setErro(null);
    });
    gatilho.current?.focus();
  };

  if (!confirmando) {
    return (
      <Button
        ref={gatilho}
        size="sm"
        variant="ghost"
        onClick={abrir}
        aria-label={rotuloAcessivel}
        className={className}
      >
        {rotulo}
      </Button>
    );
  }

  return (
    <div className="flex basis-full flex-wrap items-center justify-end gap-2 rounded-xl bg-erro/5 px-3 py-2">
      <p className="mr-auto text-sm text-tinta">{pergunta}</p>
      <Button ref={cancelar} size="sm" variant="ghost" onClick={fechar} disabled={pendente}>
        Cancelar
      </Button>
      <Button
        size="sm"
        onClick={() =>
          iniciar(async () => {
            const resposta = await acao();
            if (resposta?.erro) setErro(resposta.erro);
          })
        }
        disabled={pendente}
        className="bg-erro text-palha-50 shadow-none hover:bg-erro/90"
      >
        {pendente ? executando : confirmar}
      </Button>
      {erro && (
        <p role="alert" className="basis-full text-right text-sm text-erro">
          {erro}
        </p>
      )}
    </div>
  );
}
