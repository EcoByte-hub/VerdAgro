import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Sprout } from "lucide-react";
import { Carregando } from "@/components/app/carregando";
import { Cabecalho } from "@/components/app/cabecalho";
import { CardProjeto } from "@/components/projeto/card-projeto";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { exigirPapel } from "@/lib/auth/sessao";
import { listarProjetosDoProdutor } from "@/lib/dados";

export const metadata: Metadata = { title: "Meus projetos" };

async function Conteudo() {
  const sessao = await exigirPapel("produtor");
  const projetos = await listarProjetosDoProdutor(sessao);

  return (
    <>
      <Cabecalho
        eyebrow="Projetos de carbono"
        titulo="Meus projetos"
        descricao="Edite os dados, acompanhe o estágio e escolha o que aparece no marketplace."
      />

      {projetos.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projetos.map((p) => (
            <CardProjeto key={p.id} projeto={p} href={`/produtor/projetos/${p.id}`} mostrarPublicacao />
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-start gap-4 border-dashed">
          <Sprout className="text-musgo" />
          <div>
            <CardTitle>Nenhum projeto ainda</CardTitle>
            <p className="mt-1 text-sm text-tinta-soft">
              Gere o diagnóstico de uma propriedade para descobrir oportunidades de projeto.
            </p>
          </div>
          <Link href="/produtor" className={buttonClasses({ size: "sm" })}>
            Ver propriedades
          </Link>
        </Card>
      )}
    </>
  );
}

export default function MeusProjetosPage() {
  return (
    <Suspense fallback={<Carregando />}>
      <Conteudo />
    </Suspense>
  );
}
