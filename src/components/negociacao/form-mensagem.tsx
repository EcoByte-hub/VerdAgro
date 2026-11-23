"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Send } from "lucide-react";
import { enviarMensagem, type EstadoNegociacao } from "@/app/(app)/negociacoes/[id]/actions";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";

export function FormMensagem({ interesseId }: { interesseId: string }) {
  const [corpo, setCorpo] = useState("");
  const [estado, acao, pendente] = useActionState(
    async (anterior: EstadoNegociacao, formData: FormData): Promise<EstadoNegociacao> => {
      try {
        const resultado = await enviarMensagem(anterior, formData);
        if (resultado?.ok) setCorpo("");
        return resultado;
      } catch {
        return { erro: "Não foi possível enviar a mensagem. Tente novamente." };
      }
    },
    undefined,
  );

  return (
    <form action={acao} className="space-y-3 border-t border-areia pt-5" aria-busy={pendente}>
      <input type="hidden" name="interesseId" value={interesseId} />
      <div>
        <Label htmlFor="corpo">Sua mensagem</Label>
        <Textarea
          id="corpo"
          name="corpo"
          value={corpo}
          onChange={(evento) => setCorpo(evento.target.value)}
          required
          maxLength={4000}
          readOnly={pendente}
          aria-invalid={Boolean(estado?.erro)}
          aria-describedby={estado?.erro ? "limite-mensagem erro-mensagem" : "limite-mensagem"}
          placeholder="Alinhe detalhes, prazos ou tire dúvidas sobre o projeto..."
        />
        <p id="limite-mensagem" className="mt-1 text-xs text-tinta-soft">
          Até 4.000 caracteres. Use Atualizar conversa para ver novas mensagens.
        </p>
      </div>
      {estado?.erro && (
        <p id="erro-mensagem" role="alert" className="text-sm text-erro">
          {estado.erro}
        </p>
      )}
      {estado?.ok && (
        <p role="status" className="text-sm text-musgo">
          {estado.ok}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" disabled={pendente} className="w-full sm:w-auto">
          <Send size={16} aria-hidden /> {pendente ? "Enviando..." : "Enviar mensagem"}
        </Button>
      </div>
    </form>
  );
}

export function AtualizarConversa() {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();

  return (
    <Button size="sm" variant="secondary" onClick={() => iniciar(() => router.refresh())} disabled={pendente}>
      <RefreshCw size={15} aria-hidden /> {pendente ? "Atualizando..." : "Atualizar conversa"}
    </Button>
  );
}
