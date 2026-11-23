"use client";

import { Button } from "@/components/ui/button";

export default function ErroNegociacao({ retry }: { retry: () => void }) {
  return (
    <div className="rounded-2xl border border-areia bg-palha-50 p-6" role="alert">
      <h1 className="font-display-soft text-2xl text-mata-900">Não foi possível carregar a negociação</h1>
      <p className="mt-2 mb-4 text-sm text-tinta-soft">Tente novamente para ver o histórico atualizado.</p>
      <Button onClick={retry}>Tentar novamente</Button>
    </div>
  );
}
