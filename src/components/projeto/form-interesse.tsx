"use client";

import { useActionState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { manifestarInteresse } from "@/app/(app)/marketplace/[id]/actions";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/input";

export function FormInteresse({ projetoId }: { projetoId: string }) {
  const [estado, acao, pendente] = useActionState(manifestarInteresse, undefined);

  if (estado?.ok) {
    return (
      <p className="flex items-start gap-2 rounded-2xl bg-broto/25 p-4 text-sm text-mata-900">
        <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> {estado.ok}
      </p>
    );
  }

  return (
    <form action={acao} className="space-y-3">
      <input type="hidden" name="projetoId" value={projetoId} />
      <div>
        <Label htmlFor="mensagem">Mensagem ao produtor</Label>
        <Textarea
          id="mensagem"
          name="mensagem"
          required
          minLength={10}
          placeholder="Conte o interesse da sua empresa, prazos e formato de parceria..."
        />
      </div>
      <div>
        <Label htmlFor="volume">Volume de interesse (tCO₂e, opcional)</Label>
        <Input id="volume" name="volume" inputMode="decimal" placeholder="Ex.: 5000" />
        <p className="mt-1 text-xs text-tinta-soft">
          Referência para negociação futura. Não é compra de crédito emitido.
        </p>
      </div>
      <FieldError>{estado?.erro}</FieldError>
      <Button type="submit" className="w-full" disabled={pendente}>
        <Send size={16} /> {pendente ? "Enviando..." : "Manifestar interesse"}
      </Button>
    </form>
  );
}
