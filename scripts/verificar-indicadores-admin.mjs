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

  expect(
    "totais do seed incluem produtores, empresas, interesses e projetos",
    Number(base.producers) === 2 &&
      Number(base.properties) === 3 &&
      Number(base.projects) === 3 &&
      Number(base.companies) === 1 &&
      Number(base.interests) === 1 &&
      Number(base.demo_properties) === 3,
  );
  expect(
    "validação conta só o estágio atual, não eventos históricos",
    Number(base.projects_in_validation) === 1,
  );
  expect("projetos sem emissão não geram créditos", Number(base.issued_credits) === 0);

  const propriedades = await q(adm, "properties?select=area_ha");
  const area = propriedades.data.reduce((total, p) => total + Number(p.area_ha), 0);
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
      Number(atual?.issued_credits) === Number(base.issued_credits) + 19.75,
    );
  } finally {
    const removida = await q(prod, `properties?id=eq.${propriedade.id}`, { method: "DELETE" });
    expect("remove os dados temporários dos testes de agregados", removida.status === 200);
  }

  const final = (await consultar(adm)).data?.[0];
  expect("remoções também atualizam todos os agregados", JSON.stringify(final) === JSON.stringify(base));
}
