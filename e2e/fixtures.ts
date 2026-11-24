import { expect, test as base, type Page } from "@playwright/test";

export const test = base.extend({
  page: async ({ page, baseURL }, executarTeste) => {
    const erros: string[] = [];
    const origem = new URL(baseURL!).origin;
    page.on("pageerror", (erro) => erros.push(erro.message));
    page.on("response", (resposta) => {
      if (resposta.url().startsWith(origem) && resposta.status() >= 500) {
        erros.push(`${resposta.status()} ${new URL(resposta.url()).pathname}`);
      }
    });
    // Tiles/geocodificação não fazem parte deste cenário; não depender da internet.
    await page
      .context()
      .route(/^https?:\/\//, (route) =>
        new URL(route.request().url()).origin === origem ? route.continue() : route.abort(),
      );
    await executarTeste(page);
    expect(erros, "Sem erros JavaScript ou respostas 5xx locais").toEqual([]);
  },
});
export { expect };

export async function entrarDemo(page: Page, papel: "produtor" | "empresa") {
  await page.goto("/entrar");
  await expect(page.getByText(/Supabase não configurado/)).toBeVisible();
  await page
    .getByRole("button", { name: papel === "produtor" ? /Produtor rural/ : /Empresa compradora/ })
    .click();
  await expect(page).toHaveURL(papel === "produtor" ? /\/produtor$/ : /\/empresa$/);
}

export async function sair(page: Page) {
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page).toHaveURL(/\/entrar$/);
}
