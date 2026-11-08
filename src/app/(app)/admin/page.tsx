import type { Metadata } from "next";
import { Cabecalho } from "@/components/app/cabecalho";
import { Card } from "@/components/ui/card";
import { exigirPapel } from "@/lib/auth/sessao";

export const metadata: Metadata = { title: "Administração" };

/** Painel administrativo: indicadores de sucesso do documento de concepção (issue no backlog). */
export default async function AdminPage() {
  await exigirPapel("admin");
  return (
    <>
      <Cabecalho
        eyebrow="Administração"
        titulo="Indicadores da plataforma"
        descricao="Produtores, propriedades, hectares, projetos, empresas e interesses."
      />
      <Card className="border-dashed text-tinta-soft">
        Em construção. Veja a issue do painel administrativo.
      </Card>
    </>
  );
}
