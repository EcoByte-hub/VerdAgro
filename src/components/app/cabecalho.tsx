export function Cabecalho({
  eyebrow,
  titulo,
  descricao,
  acoes,
}: {
  eyebrow?: string;
  titulo: React.ReactNode;
  descricao?: React.ReactNode;
  acoes?: React.ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="eyebrow text-musgo">{eyebrow}</p>}
        <h1 className="mt-2 font-display-soft text-3xl text-mata-900 sm:text-4xl">{titulo}</h1>
        {descricao && <p className="mt-2 max-w-2xl text-tinta-soft">{descricao}</p>}
      </div>
      {acoes && <div className="flex shrink-0 flex-wrap gap-2">{acoes}</div>}
    </header>
  );
}
