import { entrarDemo, expect, sair, test } from "./fixtures";

const propriedade = "aaaaaaaa-0000-4000-8000-000000000001";
const projeto = "bbbbbbbb-0000-4000-8000-000000000001";
const pastagem = "bbbbbbbb-0000-4000-8000-000000000002";

test("percorre os sete passos possíveis da demonstração", async ({ page }) => {
  await test.step("1. acesso e cadastro da propriedade com polígono e prática", async () => {
    await entrarDemo(page, "produtor");
    await page.getByRole("link", { name: "Nova propriedade", exact: true }).first().click();
    await expect(page.getByRole("button", { name: "Desenhe o limite no mapa", exact: true })).toBeDisabled();
    await page.getByRole("button", { name: "Usar polígono da fazenda demonstrativa", exact: true }).click();
    await expect(page.getByText("200,0 ha", { exact: true })).toBeVisible();
    await page.getByLabel("Nome da propriedade", { exact: true }).fill("Fazenda da demonstração E2E");
    await page.getByLabel("Município", { exact: true }).fill("Rio Verde");
    await page.getByRole("button", { name: /^UF:/ }).click();
    await page.getByRole("option", { name: /Goiás/ }).click();
    await page.getByRole("button", { name: /^Plantio direto: ano de início/ }).click();
    const ano = await page.evaluate(() => new Date().getFullYear());
    await page.getByRole("button", { name: String(ano), exact: true }).click();
    await expect(page.getByLabel("Plantio direto", { exact: true })).toBeChecked();
    await page.getByRole("button", { name: "Salvar propriedade", exact: true }).click();
    await expect(
      page.getByText(
        "No modo demonstração o cadastro não é salvo. Configure o Supabase para cadastrar propriedades.",
        { exact: true },
      ),
    ).toBeVisible();
  });

  await test.step("2. diagnóstico com fallback local e guarda-corpos", async () => {
    await page.getByRole("link", { name: /^Painel/ }).click();
    await page.locator(`a[href="/produtor/propriedades/${propriedade}"]:visible`).click();
    await expect(page.getByRole("heading", { name: "Fazenda Boa Vista", exact: true })).toBeVisible();
    const geracao = page.waitForResponse(
      (resposta) =>
        new URL(resposta.url()).pathname === `/produtor/propriedades/${propriedade}` &&
        resposta.request().method() === "POST",
    );
    await page.getByRole("button", { name: /^Gerar diagnóstico$|^Gerar novamente$/ }).click();
    expect((await geracao).ok()).toBe(true);
    await expect(page.getByRole("button", { name: "Gerar novamente", exact: true })).toBeVisible();
    await expect(page.getByRole("alert").filter({ hasText: /Não foi possível gerar/ })).toHaveCount(0);
    await expect(page.getByText(/A Fazenda Boa Vista já adota plantio direto/)).toBeVisible();
    await expect(page.getByText(/Satélite: demo · Clima: demo · IA: demo/)).toBeVisible();
    await expect(page.getByText("Práticas identificadas", { exact: true })).toBeVisible();
    await expect(page.getByText("Documentos necessários", { exact: true })).toBeVisible();
    await expect(page.getByText(/Diagnóstico preliminar\. As recomendações não substituem/)).toBeVisible();
  });

  await test.step("3. projeto e evidências demonstrativas, sem gravação fictícia", async () => {
    await page.getByRole("link", { name: "Meus projetos", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Meus projetos", exact: true })).toBeVisible();
    await page.locator(`a[href="/produtor/projetos/${projeto}"]:visible`).click();
    await expect(
      page.getByRole("heading", { name: "Culturas de cobertura na entressafra", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Publicado no marketplace", { exact: true })).toBeVisible();
    await expect(
      page.getByText("CAR - Fazenda Boa Vista (demonstrativo).pdf", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Editar", exact: true }).click();
    await expect(page.getByLabel("Área do projeto (ha)", { exact: true })).toHaveValue("140");
    await page.getByRole("button", { name: "Salvar alterações", exact: true }).click();
    await expect(page.getByText(/No modo demonstração as alterações não são salvas/)).toBeVisible();
    await page.getByRole("button", { name: "Cancelar", exact: true }).click();
    await page.getByRole("button", { name: /^Tipo do documento:/ }).click();
    await page.getByRole("option", { name: "CAR", exact: true }).click();
    await page.locator('input[type="file"]').setInputFiles({
      name: "evidencia-e2e.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\nEvidência demonstrativa\n%%EOF"),
    });
    await page.getByRole("button", { name: "Enviar documento", exact: true }).click();
    await expect(
      page.getByText("Arquivo válido. No modo demonstração ele não é enviado.", { exact: true }),
    ).toBeVisible();
  });

  await test.step("4. projeto publicado no marketplace com rastreabilidade", async () => {
    await page.getByRole("link", { name: "Ver no marketplace", exact: true }).click();
    await expect(page).toHaveURL(`/marketplace/${projeto}`);
    await expect(page.getByText(/localização aproximada/).filter({ visible: true })).toBeVisible();
    await expect(page.getByText("Rastreabilidade", { exact: true }).filter({ visible: true })).toBeVisible();
    await expect(
      page.getByText("Projeto cadastrado", { exact: true }).filter({ visible: true }),
    ).toBeVisible();
    await expect(page.getByText(/Nenhum crédito emitido/).filter({ visible: true })).toBeVisible();
  });

  await test.step("5. empresa encontra um projeto pelos filtros", async () => {
    await sair(page);
    await entrarDemo(page, "empresa");
    await page.getByRole("link", { name: "Explorar marketplace", exact: true }).click();
    await page.getByRole("textbox", { name: "Buscar", exact: true }).fill("Jataí");
    await page.getByRole("button", { name: /^UF:/ }).click();
    await page.getByRole("option", { name: /Goiás/ }).click();
    await page.getByRole("button", { name: /^Prática:/ }).click();
    await page.getByRole("option", { name: "Recuperação de pastagens", exact: true }).click();
    await page.getByRole("button", { name: "Filtrar", exact: true }).click();
    await expect(page).toHaveURL(/busca=Jata%C3%AD/);
    await page.locator(`a[href="/marketplace/${pastagem}"]:visible`).click();
    await expect(
      page.getByRole("heading", { name: "Recuperação de pastagem degradada", exact: true }),
    ).toBeVisible();
    await expect(page.getByText(/localização aproximada/).filter({ visible: true })).toBeVisible();
  });

  await test.step("6. interesse valida volume e retorna confirmação de simulação", async () => {
    await page
      .getByLabel("Mensagem ao produtor", { exact: true })
      .fill("Gostaria de conversar sobre o projeto e as evidências disponíveis.");
    await page.getByLabel("Volume de interesse (tCO₂e, opcional)", { exact: true }).fill("-1");
    await page.getByRole("button", { name: "Manifestar interesse", exact: true }).click();
    await expect(page.getByText("Volume inválido", { exact: true })).toBeVisible();
    // Repreencher: formulários React podem limpar campos não controlados após o envio.
    await page
      .getByLabel("Mensagem ao produtor", { exact: true })
      .fill("Gostaria de conversar sobre o projeto e as evidências disponíveis.");
    await page.getByLabel("Volume de interesse (tCO₂e, opcional)", { exact: true }).fill("100,5");
    await page.getByRole("button", { name: "Manifestar interesse", exact: true }).click();
    await expect(page.getByText(/Interesse simulado \(modo demonstração\)/)).toBeVisible();
  });

  await test.step("7. produtor consulta o interesse de exemplo no painel", async () => {
    await sair(page);
    await entrarDemo(page, "produtor");
    const interesses = page.getByRole("region", { name: "Interesses recebidos", exact: true });
    await expect(interesses.getByText("Grupo Alimentos Horizonte", { exact: true })).toBeVisible();
    await expect(interesses.getByText("Novo", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /Painel.*1 interesse novo/ })).toBeVisible();
    await sair(page);
  });
});

test("protege as rotas e encerra a sessão demonstrativa", async ({ page }) => {
  await page.goto("/produtor");
  await expect(page).toHaveURL(/\/entrar\?voltar=/);
  await entrarDemo(page, "empresa");
  await page.goto("/produtor/projetos");
  await expect(page).toHaveURL(/\/empresa$/);
  await page.goto("/marketplace/00000000-0000-4000-8000-000000000000");
  await expect(page.getByRole("heading", { name: "404", exact: true })).toBeVisible();
  await page.goto("/empresa");
  await sair(page);
  await page.goto("/empresa");
  await expect(page).toHaveURL(/\/entrar\?voltar=/);
});

test("mostra estado vazio quando os filtros não encontram projetos", async ({ page }) => {
  await entrarDemo(page, "empresa");
  await page.getByRole("link", { name: "Explorar marketplace", exact: true }).click();
  await page.getByRole("textbox", { name: "Buscar", exact: true }).fill("projeto-inexistente-e2e");
  await page.getByRole("button", { name: "Filtrar", exact: true }).click();
  await expect(page.getByText("Nenhum projeto encontrado com esses filtros.", { exact: true })).toBeVisible();
});
