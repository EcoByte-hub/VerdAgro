"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { excluirDocumento } from "@/app/(app)/produtor/projetos/[id]/actions";
import { Button } from "@/components/ui/button";

/** Lixeira com confirmação: a confirmação ocupa uma linha inteira abaixo do documento. */
export function RemoverDocumento({ id, nome }: { id: string; nome: string }) {
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [removendo, iniciar] = useTransition();

  if (!confirmando) {
    return (
      <button
        type="button"
        aria-label={`Remover ${nome}`}
        onClick={() => setConfirmando(true)}
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-argila transition-colors hover:bg-erro/10 hover:text-erro"
      >
        <Trash2 size={16} aria-hidden />
      </button>
    );
  }

  return (
    <div className="flex basis-full flex-wrap items-center justify-end gap-2 rounded-xl bg-erro/5 px-3 py-2">
      <p className="mr-auto text-sm text-tinta">Remover este documento?</p>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          setConfirmando(false);
          setErro(null);
        }}
        disabled={removendo}
      >
        Cancelar
      </Button>
      <Button
        size="sm"
        onClick={() =>
          iniciar(async () => {
            const resposta = await excluirDocumento(id);
            if (resposta?.erro) setErro(resposta.erro);
          })
        }
        disabled={removendo}
        className="bg-erro text-palha-50 shadow-none hover:bg-erro/90"
      >
        {removendo ? "Removendo..." : "Remover"}
      </Button>
      {erro && (
        <p role="alert" className="basis-full text-right text-sm text-erro">
          {erro}
        </p>
      )}
    </div>
  );
}
