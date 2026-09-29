export const onlyDigits = (s: string) => s.replace(/\D/g, "");

export const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const fmtCpf = (v: string) =>
  onlyDigits(v).slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");

export const fmtCep = (v: string) => onlyDigits(v).slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2");

export const fmtCel = (v: string) =>
  onlyDigits(v).slice(0, 11)
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");

export const fmtMoneyCents = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Lê valores em reais do jeito que a pessoa digitar: "1000", "1.000", "1000,5", "1.000,50", "10.5".
export function parseReaisParaCentavos(texto: string): number {
  const s = texto.replace(/[^\d.,]/g, "");
  if (!s) return 0;
  let inteiro = s;
  let decimal = "";
  const virgula = s.lastIndexOf(",");
  if (virgula >= 0) {
    inteiro = s.slice(0, virgula);
    decimal = s.slice(virgula + 1);
  } else {
    const partes = s.split(".");
    const ultima = partes[partes.length - 1];
    // Um ponto com até 2 casas no fim é decimal ("10.5"); com 3 casas é milhar ("1.000").
    if (partes.length > 1 && ultima.length <= 2) {
      inteiro = partes.slice(0, -1).join("");
      decimal = ultima;
    }
  }
  const reais = Number(inteiro.replace(/\D/g, "") || "0");
  const cent = Number(decimal.replace(/\D/g, "").slice(0, 2).padEnd(2, "0") || "0");
  return reais * 100 + cent;
}

export const digitsToCents =(s: string, max: number) => Math.min(Number(onlyDigits(s) || "0"), max);

export const hhmm = (d: Date) => d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

// ─── cartão ───────────────────────────────────────────────────────────────────
export type CardBrand = "visa" | "mastercard" | "amex" | "elo" | "hipercard" | "desconhecida";

export const BRAND_LABEL: Record<CardBrand, string> = {
  visa: "Visa", mastercard: "Mastercard", amex: "Amex", elo: "Elo", hipercard: "Hipercard", desconhecida: "",
};

export function cardBrand(num: string): CardBrand {
  const n = onlyDigits(num);
  if (/^(4011|4312|4389|4514|4576|5041|5066|5067|509|6277|6362|6363|650|6516|6550)/.test(n)) return "elo";
  if (/^(606282|3841)/.test(n)) return "hipercard";
  if (/^3[47]/.test(n)) return "amex";
  if (/^4/.test(n)) return "visa";
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(n)) return "mastercard";
  return "desconhecida";
}

export function luhn(num: string) {
  const n = onlyDigits(num);
  let sum = 0;
  let alt = false;
  for (let i = n.length - 1; i >= 0; i--) {
    let d = Number(n[i]);
    if (alt) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
    alt = !alt;
  }
  return n.length > 0 && sum % 10 === 0;
}

export function fmtCard(num: string) {
  const brand = cardBrand(num);
  const n = onlyDigits(num).slice(0, brand === "amex" ? 15 : 16);
  if (brand === "amex") {
    return [n.slice(0, 4), n.slice(4, 10), n.slice(10, 15)].filter(Boolean).join(" ");
  }
  return n.replace(/(\d{4})(?=\d)/g, "$1 ");
}

export const fmtExp = (v: string) => {
  const d = onlyDigits(v).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

export function expStatus(v: string, now = new Date()): "ok" | "invalido" | "vencido" {
  const d = onlyDigits(v);
  if (d.length < 4) return "invalido";
  const mm = Number(d.slice(0, 2));
  const yy = 2000 + Number(d.slice(2));
  if (mm < 1 || mm > 12) return "invalido";
  const fimDoMes = new Date(yy, mm, 0, 23, 59, 59);
  return fimDoMes < now ? "vencido" : "ok";
}

// ─── renda / duração ──────────────────────────────────────────────────────────
// anos que o saldo sustenta a renda mensal; null = indefinidamente (renda <= rendimento)
export function duracaoRenda(saldo: number, renda: number, taxaAnual = 0.09): number | null {
  const r = Math.pow(1 + taxaAnual, 1 / 12) - 1;
  if (renda <= saldo * r) return null;
  const n = -Math.log(1 - (saldo * r) / renda) / Math.log(1 + r);
  return n / 12;
}

// ─── impressão / PDF ──────────────────────────────────────────────────────────
export function printHtml(html: string): boolean {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank");
  if (!w) {
    URL.revokeObjectURL(url);
    return false;
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return true;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
