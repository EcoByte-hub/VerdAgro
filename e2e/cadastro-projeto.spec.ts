import { expect } from "./fixtures";
import { entrarDemo } from "./fixtures";
import { test } from "./fixtures";

test("passo 3: formulário de novo projeto com pré-seleção do diagnóstico", async ({ page }) => {
  await entrarDemo(page, "produtor");

  await page.goto("/produtor/projetos");
  await page.getByRole("link", { name: "Novo projeto" }).first().click();
  await expect(page).toHaveURL(/\/produtor\/projetos\/nova$/);
  await expect(page.getByLabel("Propriedade", { exact: true })).toBeVisible();
  await expect(page.getByText(/Até .* ha, a área da propriedade/)).toBeVisible();

  // Pré-seleção vinda de uma oportunidade do diagnóstico (query params)
  await page.goto(
    "/produtor/projetos/nova?propriedade=aaaaaaaa-0000-4000-8000-000000000001&pratica=recuperacao_pastagens&titulo=Recupera%C3%A7%C3%A3o%20de%20pastagem",
  );
  await expect(page.getByLabel("Prática", { exact: true })).toHaveValue("recuperacao_pastagens");
  await expect(page.getByLabel("Título", { exact: true })).toHaveValue(/Recuperação de pastagem/);

  // Modo demonstração não grava: o aviso aparece e nenhum 5xx estoura (fixture)
  await page.getByLabel("Área do projeto (ha)", { exact: true }).fill("80");
  await page.getByRole("button", { name: "Criar projeto" }).click();
  await expect(page.getByText(/modo demonstração/i)).toBeVisible();
});
