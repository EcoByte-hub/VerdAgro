import Link from "next/link";
import { Cabecalho } from "@/components/app/cabecalho";
import { buttonClasses } from "@/components/ui/button";

export default function NegociacaoNaoEncontrada() {
  return (
    <>
      <Cabecalho
        titulo="Negociação indisponível"
        descricao="Esta negociação não existe ou você não participa dela."
      />
      <Link href="/inicio" className={buttonClasses({})}>
        Voltar ao painel
      </Link>
    </>
  );
}
