/** Casos da issue #12. Usa somente o projeto temporário de verificar-rls.mjs. */
export async function verificarNegociacoes({
  q,
  expect,
  prod,
  coop,
  emp,
  anon,
  projetoId,
  produtorId,
  empresaId,
}) {
  const post = (body) => ({ method: "POST", body: JSON.stringify(body) });
  const patch = (body) => ({ method: "PATCH", body: JSON.stringify(body) });
  const nova = await q(
    emp,
    "interests",
    post({
      project_id: projetoId,
      company_id: empresaId,
      message: "Interesse para conversar com o produtor",
    }),
  );
  const interesse = nova.data?.[0];
  expect("prepara negociação entre produtor e empresa", nova.status === 201 && Boolean(interesse));
  if (!interesse) return;

  const consulta = `interests?id=eq.${interesse.id}`;
  const mensagens = `interest_messages?interest_id=eq.${interesse.id}&select=id,author_id,body,created_at&order=created_at.asc,id.asc`;
  const mensagem = (autor, corpo) => ({ interest_id: interesse.id, author_id: autor, body: corpo });
  const iniciar = await q(prod, consulta, patch({ status: "em_negociacao" }));
  expect("produtor inicia negociação no próprio projeto", iniciar.data?.[0]?.status === "em_negociacao");
  expect(
    "empresa acompanha o status em negociação",
    (await q(emp, consulta)).data?.[0]?.status === "em_negociacao",
  );

  const daEmpresa = await q(emp, "interest_messages", post(mensagem(empresaId, "Podemos alinhar o volume?")));
  const doProdutor = await q(
    prod,
    "interest_messages",
    post(mensagem(produtorId, "Sim, vamos conversar sobre o projeto.")),
  );
  expect("empresa envia mensagem na negociação", daEmpresa.status === 201);
  expect("produtor responde na mesma negociação", doProdutor.status === 201);

  const historicoProdutor = await q(prod, mensagens);
  const historicoEmpresa = await q(emp, mensagens);
  const autores = historicoProdutor.data?.map?.((m) => m.author_id);
  expect(
    "os dois participantes leem o mesmo histórico em ordem cronológica",
    historicoProdutor.status === 200 &&
      historicoEmpresa.status === 200 &&
      JSON.stringify(autores) === JSON.stringify([empresaId, produtorId]) &&
      JSON.stringify(historicoEmpresa.data) === JSON.stringify(historicoProdutor.data) &&
      historicoProdutor.data[0]?.id === daEmpresa.data?.[0]?.id &&
      historicoProdutor.data[1]?.id === doProdutor.data?.[0]?.id,
  );

  const cooperativaId = "22222222-2222-4222-8222-222222222222";
  expect("terceiro não lê o histórico", JSON.stringify((await q(coop, mensagens)).data) === "[]");
  expect(
    "terceiro não envia mensagem na negociação alheia",
    (await q(coop, "interest_messages", post(mensagem(cooperativaId, "Não participo desta negociação"))))
      .status >= 400,
  );
  expect(
    "empresa não envia mensagem como se fosse o produtor",
    (await q(emp, "interest_messages", post(mensagem(produtorId, "Autor falsificado")))).status >= 400,
  );
  expect(
    "produtor não envia mensagem como se fosse a empresa",
    (await q(prod, "interest_messages", post(mensagem(empresaId, "Autor falsificado")))).status >= 400,
  );
  expect(
    "anônimo não envia mensagem",
    (await q(anon, "interest_messages", post(mensagem(empresaId, "Mensagem anônima")))).status >= 400,
  );
  for (const [rotulo, corpo] of [
    ["vazia", ""],
    ["acima de 4.000 caracteres", "a".repeat(4001)],
  ]) {
    const resposta = await q(emp, "interest_messages", post(mensagem(empresaId, corpo)));
    expect(`banco rejeita mensagem ${rotulo}`, resposta.status >= 400 && resposta.data?.code === "23514");
  }
  const primeiraMensagem = daEmpresa.data?.[0]?.id;
  expect(
    "mensagem enviada não pode ser adulterada",
    (await q(emp, `interest_messages?id=eq.${primeiraMensagem}`, patch({ body: "Texto substituído" })))
      .status >= 400,
  );

  expect(
    "empresa não aceita o próprio interesse",
    (await q(emp, consulta, patch({ status: "aceita" }))).status >= 400,
  );
  expect(
    "terceiro não aceita interesse em projeto alheio",
    JSON.stringify((await q(coop, consulta, patch({ status: "aceita" }))).data) === "[]",
  );
  const aceita = await q(prod, consulta, patch({ status: "aceita" }));
  expect("produtor aceita o interesse em negociação", aceita.data?.[0]?.status === "aceita");
  expect("empresa acompanha o aceite", (await q(emp, consulta)).data?.[0]?.status === "aceita");
  expect(
    "histórico continua disponível após o aceite",
    JSON.stringify((await q(prod, mensagens)).data) === JSON.stringify(historicoProdutor.data) &&
      JSON.stringify((await q(emp, mensagens)).data) === JSON.stringify(historicoEmpresa.data),
  );
}
