import { expect } from "./fixtures";
import { entrarDemo } from "./fixtures";
import { test } from "./fixtures";

const projeto = "bbbbbbbb-0000-4000-8000-000000000001"; // desenvolvimento → validação

test("avanço de estágio aparece na rastreabilidade e é bloqueado no modo demonstração", async ({
  page,
}) => {
  await entrarDemo(page, "produtor");
  await page.goto(`/produtor/projetos/${projeto}`);

  const botao = page.getByRole("button", { name: /Avançar para Validação/ });
  await expect(botao).toBeVisible();
  await expect(
    page.getByText("Este estágio exige a nota: registre quem verificou e com qual evidência."),
  ).toBeVisible();

  await page.getByLabel("Nota da mudança").fill("Validação contratada com organismo X");
  await botao.click();
  await expect(page.getByText(/o estágio não muda/i)).toBeVisible();
});
