import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import "./copiar-worker-maplibre.mjs";

const next = fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url));
const preload = new URL("./e2e-rede.mjs", import.meta.url).href;
const env = {
  ...process.env,
  NODE_ENV: "production",
  NEXT_TELEMETRY_DISABLED: "1",
  // Valores explícitos prevalecem sobre .env; nunca usar contas ou chaves reais.
  NEXT_PUBLIC_SUPABASE_URL: "",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
  SUPABASE_SECRET_KEY: "",
  CDSE_CLIENT_ID: "",
  CDSE_CLIENT_SECRET: "",
  ANTHROPIC_API_KEY: "",
};

let filho;
let encerrando = false;
for (const sinal of ["SIGINT", "SIGTERM"]) {
  process.on(sinal, () => {
    encerrando = true;
    filho?.kill(sinal);
  });
}

function executar(args) {
  return new Promise((resolve, reject) => {
    filho = spawn(process.execPath, ["--import", preload, next, ...args], { stdio: "inherit", env });
    filho.once("error", reject);
    filho.once("exit", (codigo, sinal) => {
      if (codigo === 0 || encerrando) resolve();
      else reject(new Error(`Next ${args[0]} terminou com ${sinal ?? codigo}`));
    });
  });
}

try {
  await executar(["build"]);
  if (!encerrando) await executar(["start", "--hostname", "127.0.0.1", "--port", "3100"]);
} catch (erro) {
  console.error(erro.message);
  process.exitCode = 1;
}
