"use client";

import { useActionState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { alterarPublicacao } from "@/app/(app)/produtor/projetos/[id]/actions";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/input";

/** Liga/desliga a visibilidade do projeto no marketplace. */
export function BotaoPublicacao({ projetoId, publicado }: { projetoId: string; publicado: boolean }) {
  const [estado, acao, pendente] = useActionState(alterarPublicacao, undefined);

  return (
    <form action={acao} className="w-full sm:w-auto sm:max-w-xs">
      <input type="hidden" name="projetoId" value={projetoId} />
      <input type="hidden" name="publicar" value={publicado ? "nao" : "sim"} />
      <Button
        type="submit"
        variant={publicado ? "secondary" : "primary"}
        className="w-full sm:w-auto"
        disabled={pendente}
      >
        {publicado ? <EyeOff size={16} /> : <Eye size={16} />}
        {pendente ? "Salvando..." : publicado ? "Tirar do marketplace" : "Publicar no marketplace"}
      </Button>
      <FieldError>{estado?.erro}</FieldError>
    </form>
  );
}
