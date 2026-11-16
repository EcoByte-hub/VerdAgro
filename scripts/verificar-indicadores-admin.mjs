/** Casos da issue #14, executados por db:verificar somente no Supabase local. */
export async function verificarIndicadoresAdmin({ q, expect, prod, coop, emp, adm, anon }) {
  const consultar = (token) => q(token, "rpc/indicadores_admin", { method: "POST", body: "{}" });

  for (const [papel, token] of [
    ["produtor", prod],
    ["cooperativa", coop],
    ["empresa", emp],
    ["anônimo", anon],
  ]) {
    const resposta = await consultar(token);
    expect(
      `${papel} não acessa agregados nem pela RPC direta`,
      [401, 403].includes(resposta.status) && resposta.data?.code === "42501",
    );
  }

  const inicial = await consultar(adm);
  const base = inicial.data?.[0];
  expect("admin consulta todos os indicadores", inicial.status === 200 && Boolean(base));
  if (!base) return;

  // A API limita cada página a 1.000 registros. Compara com os dados atuais do
  // banco inteiro, sem depender das quantidades ou dos estágios do seed.
  const listar = async (consulta) => {
    const linhas = [];
    for (let offset = 0; ; offset += 1000) {
      const resposta = await q(adm, `${consulta}&order=id&offset=${offset}&limit=1000`);
      if (resposta.status !== 200 || !Array.isArray(resposta.data)) {
        throw new Error(`Não foi possível conferir os agregados: ${consulta}`);
      }
      linhas.push(...resposta.data);
      if (resposta.data.length < 1000) return linhas;
    }
  };
  const perfis = await listar("profiles?select=id,role");
  const propriedades = await listar("properties?select=id,area_ha,is_demo");
  const projetosAtuais = await listar("projects?select=id,current_stage,issued_credits");
  const interesses = await listar("interests?select=id");
  expect(
    "totais correspondem aos dados atuais, inclusive além do seed",
    Number(base.producers) === perfis.filter((p) => p.role === "produtor").length &&
      Number(base.properties) === propriedades.length &&
      Number(base.projects) === projetosAtuais.length &&
      Number(base.companies) === perfis.filter((p) => p.role === "empresa").length &&
      Number(base.interests) === interesses.length &&
      Number(base.demo_properties) === propriedades.filter((p) => p.is_demo).length,
  );
  expect(
    "validação conta só o estágio atual, não eventos históricos",
    Number(base.projects_in_validation) ===
      projetosAtuais.filter((p) => p.current_stage === "validacao").length,
  );
  const emitidos = projetosAtuais
    .filter((p) => ["emissao_creditos", "comercializacao"].includes(p.current_stage))
    .reduce((total, p) => total + Number(p.issued_credits ?? 0), 0);
  expect(
    "créditos somam somente volumes nos estágios de emissão e comercialização",
    Math.abs(Number(base.issued_credits) - emitidos) < 0.001,
  );

  const area = propriedades.reduce((total, p) => total + Number(p.area_ha), 0);
  expect(
    "hectares vêm das propriedades, não da área dos projetos",
    Math.abs(Number(base.hectares) - area) < 0.001,
  );

  const nova = await q(prod, "properties", {
    method: "POST",
    body: JSON.stringify({
      owner_id: "11111111-1111-4111-8111-111111111111",
      name: "Teste de agregados",
      city: "Rio Verde",
      state: "GO",
      boundary: "SRID=4326;POLYGON((-50.97 -17.86,-50.96 -17.86,-50.96 -17.85,-50.97 -17.85,-50.97 -17.86))",
    }),
  });
  const propriedade = nova.data?.[0];
  expect(
    "prepara propriedade para testar atualização dos indicadores",
    nova.status === 201 && Boolean(propriedade),
  );
  if (!propriedade) return;

  try {
    const projetos = await q(prod, "projects", {
      method: "POST",
      body: JSON.stringify(
        [
          { current_stage: "validacao", issued_credits: null },
          { current_stage: "emissao_creditos", issued_credits: 12.5 },
          { current_stage: "comercializacao", issued_credits: 7.25 },
        ].map((p) => ({
          ...p,
          property_id: propriedade.id,
          owner_id: propriedade.owner_id,
          title: "Projeto privado de teste",
          practice: "plantio_direto",
          area_ha: 10,
          is_published: false,
        })),
      ),
    });
    expect("prepara projetos em validação, emissão e comercialização", projetos.status === 201);

    const atual = (await consultar(adm)).data?.[0];
    expect(
      "novos projetos privados entram nos totais imediatamente",
      Number(atual?.projects) === Number(base.projects) + 3,
    );
    expect(
      "projetos na mesma propriedade não duplicam hectares",
      Number(atual?.properties) === Number(base.properties) + 1 &&
        Math.abs(Number(atual?.hectares) - Number(base.hectares) - Number(propriedade.area_ha)) < 0.001,
    );
    expect(
      "validação ignora projetos em estágios posteriores",
      Number(atual?.projects_in_validation) === Number(base.projects_in_validation) + 1,
    );
    expect(
      "emissões somam volumes fracionários dos dois estágios finais",
      Math.abs(Number(atual?.issued_credits) - Number(base.issued_credits) - 19.75) < 0.001,
    );
  } finally {
    const removida = await q(prod, `properties?id=eq.${propriedade.id}`, { method: "DELETE" });
    expect("remove os dados temporários dos testes de agregados", removida.status === 200);
  }

  const final = (await consultar(adm)).data?.[0];
  expect("remoções também atualizam todos os agregados", JSON.stringify(final) === JSON.stringify(base));
}
