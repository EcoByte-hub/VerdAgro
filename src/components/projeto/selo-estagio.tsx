import { Tag } from "@/components/ui/tag";
import { infoEstagio, type Estagio } from "@/lib/dados/tipos";

/** Selo do estágio atual com a semântica estimativa x certificado. */
export function SeloEstagio({ estagio }: { estagio: Estagio }) {
  const info = infoEstagio(estagio);
  return <Tag kind={info.tipo}>{info.rotulo}</Tag>;
}
