// Preload exclusivo do servidor E2E. O app normal não importa este arquivo.
const fetchOriginal = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)
  ) {
    return fetchOriginal(input, init);
  }
  if (url.hostname === "power.larc.nasa.gov") {
    // Exercita o fallback climático já existente, com dados locais determinísticos.
    return new Response("NASA POWER indisponível no cenário E2E offline", { status: 503 });
  }
  throw new Error(`E2E bloqueou chamada externa do servidor: ${url.origin}`);
};
