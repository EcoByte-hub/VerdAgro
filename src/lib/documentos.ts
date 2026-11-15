import { formatNumber } from "@/lib/utils";

/**
 * Regras dos documentos e evidências de projeto. O bucket privado "evidencias"
 * (supabase/migrations/..._seguranca_rls.sql) impõe os mesmos limites no Storage;
 * aqui eles são checados antes do envio para dar a mensagem certa em português.
 */

export const BUCKET_EVIDENCIAS = "evidencias";
export const TAMANHO_MAXIMO_BYTES = 10 * 1024 * 1024;

export const FORMATOS_ACEITOS = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;
type MimeAceito = keyof typeof FORMATOS_ACEITOS;
type Extensao = (typeof FORMATOS_ACEITOS)[MimeAceito];

/** Valor do atributo accept do <input type="file">. */
export const ACCEPT_ARQUIVOS = [
  ...Object.keys(FORMATOS_ACEITOS),
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
].join(",");

const MIME_POR_EXTENSAO: Record<string, MimeAceito> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const ERRO_FORMATO = "Formato não aceito. Envie um PDF ou uma imagem (JPG, PNG ou WEBP).";
const ERRO_TAMANHO = "O arquivo passa do limite de 10 MB.";

const aceito = (mime: string): mime is MimeAceito => mime in FORMATOS_ACEITOS;

/** "850 KB", "2,4 MB". */
export function formatarTamanho(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${formatNumber(bytes / 1024 / 1024, 1)} MB`;
}

/**
 * Confere formato e tamanho. Usa a extensão quando o navegador não informa o tipo
 * (alguns Android mandam PDF como application/octet-stream ou vazio).
 */
export function validarArquivo(arquivo: {
  name: string;
  type: string;
  size: number;
}): { ok: true; mime: MimeAceito; extensao: Extensao } | { ok: false; erro: string } {
  const extensao = arquivo.name.split(".").pop()?.toLowerCase() ?? "";
  const mime = aceito(arquivo.type) ? arquivo.type : MIME_POR_EXTENSAO[extensao];
  if (!mime) return { ok: false, erro: ERRO_FORMATO };
  if (arquivo.size === 0) return { ok: false, erro: "O arquivo está vazio." };
  if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
    return { ok: false, erro: `O arquivo tem ${formatarTamanho(arquivo.size)}. O limite é 10 MB.` };
  }
  return { ok: true, mime, extensao: FORMATOS_ACEITOS[mime] };
}

/** UUID v4. crypto.randomUUID só existe em HTTPS/localhost; no celular via IP da rede não. */
function uuid() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/**
 * Caminho no bucket: "<project_id>/<uuid>.<ext>". A política do Storage usa a pasta
 * para saber o projeto; o nome original fica só em project_documents.file_name
 * (acentos e espaços no nome dariam "Invalid key" no Storage).
 */
export function caminhoNoBucket(projetoId: string, extensao: Extensao) {
  return `${projetoId}/${uuid()}.${extensao}`;
}

export function caminhoValido(projetoId: string, caminho: string) {
  const [pasta, arquivo, ...resto] = caminho.split("/");
  return (
    pasta === projetoId &&
    resto.length === 0 &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(pdf|jpg|png|webp)$/.test(
      arquivo ?? "",
    )
  );
}

/** Erros do Supabase Storage vêm em inglês: traduz os que a pessoa consegue resolver. */
export function traduzirErroStorage(erro: { message?: string; status?: number; statusCode?: string }) {
  const msg = (erro.message ?? "").toLowerCase();
  const codigo = Number(erro.statusCode ?? erro.status);
  if (codigo === 413 || /too large|maximum allowed size|exceeded/.test(msg)) return ERRO_TAMANHO;
  if (codigo === 415 || /mime|not supported/.test(msg)) return ERRO_FORMATO;
  if (codigo === 401 || codigo === 403 || /row-level security|unauthorized|not allowed/.test(msg)) {
    return "Você não tem permissão para enviar arquivos neste projeto.";
  }
  if (/failed to fetch|network|load failed/.test(msg)) {
    return "Sem conexão com o servidor. Verifique a internet e tente de novo.";
  }
  return "Não foi possível enviar o arquivo. Tente novamente.";
}
