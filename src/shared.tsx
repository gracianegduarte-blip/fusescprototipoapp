import type { ReactNode } from "react";

// ─── datas do protótipo ───────────────────────────────────────────────────────
export const ANO_ATUAL = 2026;
export const HOJE = "31/08/2026";
export const HOJE_EXT = "31 ago 2026";
export const PROXIMO_PAGAMENTO = "05 set 2026";

// ─── TOAST ────────────────────────────────────────────────────────────────────
export type ToastMsg = { id: number; text: string; type: "success" | "error" | "info" };

export function ToastContainer({ toasts }: { toasts: ToastMsg[] }) {
  return (
    <div className="fixed top-4 left-0 right-0 z-[200] flex flex-col items-center gap-2 pointer-events-none px-4"
      role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id}
          role={t.type === "error" ? "alert" : undefined}
          className="px-5 py-3 rounded-full text-sm font-semibold text-white shadow-lg"
          style={{
            background: t.type === "success" ? "#2A5C40" : t.type === "error" ? "#B42318" : "#1A6A8A",
            animation: "fadeSlideIn 0.3s ease-out both",
          }}>
          {t.text}
        </div>
      ))}
    </div>
  );
}

// ─── icons ────────────────────────────────────────────────────────────────────
type IconProps = { size?: number; sw?: number };
const mk = (children: ReactNode, size = 20, sw = 1.8) =>
  function SvgIcon(p: IconProps) {
    const s = p.size ?? size;
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={p.sw ?? sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        {children}
      </svg>
    );
  };

export const Icon = {
  Home: mk(<path d="M3 12l9-9 9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" />, 22),
  Chart: mk(<path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />, 22),
  Sim: mk(<path d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />, 22),
  User: mk(<path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />, 22),
  Plus: mk(<path d="M12 4v16m8-8H4" />, 26, 2.2),
  Eye: mk(<><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>, 20),
  EyeOff: mk(<><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></>, 20),
  Bell: mk(<path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />, 20),
  Moon: mk(<path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />, 18),
  Sun: mk(<><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></>, 18),
  Monitor: mk(<><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></>, 18),
  Chevron: mk(<path d="M19 9l-7 7-7-7" />, 14, 2.5),
  ChevronRight: mk(<path d="M9 18l6-6-6-6" />, 16, 2),
  ChevronLeft: mk(<path d="M15 18l-6-6 6-6" />, 16, 2.5),
  Check: mk(<path d="M5 13l4 4L19 7" />, 14, 2.5),
  ArrowDown: mk(<><path d="M12 16V8M8 12l4 4 4-4" /><path d="M3 17v1a2 2 0 002 2h14a2 2 0 002-2v-1" /></>, 14, 2),
  ArrowUp: mk(<path d="M12 19V5M5 12l7-7 7 7" />, 16, 2),
  Trend: mk(<path d="M23 6l-9.5 9.5-5-5L1 18M17 6h6v6" />, 16, 2),
  Alert: mk(<><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><path d="M12 9v4M12 17h.01" /></>, 18),
  CheckCircle: mk(<><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></>, 20),
  Info: mk(<><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></>, 18),
  Zap: mk(<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />, 18),
  Lock: mk(<><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></>, 18),
  Close: mk(<path d="M18 6L6 18M6 6l12 12" />, 18, 2.2),
  Refresh: mk(<><path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></>, 16, 2),
  Copy: mk(<><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></>, 16),
  Doc: mk(<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8" /></>, 20),
  Shield: mk(<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />, 20),
  Repeat: mk(<><path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 01-4 4H3" /></>, 20),
  Headset: mk(<><path d="M3 18v-6a9 9 0 0118 0v6" /><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" /></>, 18),
  ThumbUp: mk(<path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" />, 16),
  ThumbDown: mk(<path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3zm7-13h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17" />, 16),
  Dollar: mk(<path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />, 20),
  Key: mk(<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />, 20),
  Calendar: mk(<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>, 18),
  Download: mk(<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />, 16, 2),
  Pie: mk(<><path d="M21.21 15.89A10 10 0 118 2.83" /><path d="M22 12A10 10 0 0012 2v10z" /></>, 20),
  Share: mk(<path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />, 16, 2),
  Edit: mk(<path d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-1.414A2 2 0 019.586 13z" />, 14, 2),
  Send: mk(<path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />, 18, 2),
  Card: mk(<><rect x="2" y="5" width="20" height="14" rx="3" /><path d="M2 10h20M6 15h3" /></>, 22),
  Trash: mk(<><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" /><path d="M10 11v6M14 11v6" /></>, 18),
  Wallet: mk(<><path d="M20 12V8H6a2 2 0 010-4h12v4" /><path d="M4 6v12a2 2 0 002 2h14v-4" /><path d="M18 12a2 2 0 000 4h4v-4z" /></>, 24),
  Target: mk(<><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>, 16, 2),
  Star: mk(<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />, 16, 2),
  Logout: mk(<><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></>, 18, 2),
  Chat: mk(<><path d="M12 3C6.9 3 3 6.6 3 11c0 2.3 1 4.3 2.7 5.8L5 21l4.2-1.6c.9.3 1.8.4 2.8.4 5.1 0 9-3.6 9-8s-3.9-8.8-9-8.8z" /><path d="M8.5 11h.01M12 11h.01M15.5 11h.01" strokeWidth={2.6} /></>, 20),
  Menu: mk(<path d="M4 6h16M4 12h16M4 18h16" />, 22, 2),
  External: mk(<><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><path d="M15 3h6v6M10 14L21 3" /></>, 14, 2),
  Wifi: mk(<><path d="M1 1l22 22" /><path d="M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.58 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01" /></>, 18),
};

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
export const MASK = "R$ ••••••";
export const pct1 = (v: number) => v.toFixed(1).replace(".", ",");

// ─── HAPTIC ───────────────────────────────────────────────────────────────────
export function haptic(style: "light" | "medium" | "heavy" = "light") {
  if ("vibrate" in navigator) {
    navigator.vibrate(style === "light" ? 10 : style === "medium" ? 30 : 60);
  }
}

// ─── theme ────────────────────────────────────────────────────────────────────
// accent* vêm da cor da conta (identidade). positive/warning/danger são semânticas e nunca mudam com a conta.
export const T = {
  light: {
    bg: "#F5F7F5", surface: "#FFFFFF", border: "#E2EDE5", text: "#1A2A1E",
    muted: "#5B7062", tagBg: "#E6F2EB", tagText: "#2A5C40", inputBg: "#F0F8F3",
    navBg: "#FFFFFF", rowBorder: "#F0F8F3", headerBg: "#F5F7F5", bellBg: "#E6F2EB",
    shadow: "0 1px 8px rgba(42,92,64,0.05)", navShadow: "0 -4px 24px rgba(42,92,64,0.08)",
    accent: "#2A5C40", accentMid: "#3A7A55", accentText: "#2A5C40",
    accentTag: "#E6F2EB", accentPale: "#F0F8F3",
    positive: "#1F7A4D", positiveBg: "#E3F4EA",
    warning: "#8A5A00", warningBg: "#FFF6E0", warningBorder: "#F0D9A0",
    danger: "#B42318", dangerBg: "#FDECEA", dangerBorder: "#F5C6C1",
    switchOff: "#C3CEC7", overlay: "rgba(10,20,14,0.55)",
  },
  dark: {
    bg: "#0F1A14", surface: "#1A2720", border: "#2C3C31", text: "#E8F2EC",
    muted: "#8AA891", tagBg: "#1E3528", tagText: "#6DBF8A", inputBg: "#162018",
    navBg: "#141E16", rowBorder: "#1E2E22", headerBg: "#0F1A14", bellBg: "#1A2720",
    shadow: "0 1px 8px rgba(0,0,0,0.3)", navShadow: "0 -4px 24px rgba(0,0,0,0.4)",
    accent: "#2A5C40", accentMid: "#3A7A55", accentText: "#4A9E6A",
    accentTag: "#1E3528", accentPale: "#162018",
    positive: "#4ADE80", positiveBg: "#173325",
    warning: "#F2C56B", warningBg: "#33280F", warningBorder: "#5A4516",
    danger: "#FCA5A5", dangerBg: "#3A1A1A", dangerBorder: "#6B2B2B",
    switchOff: "#3A4A40", overlay: "rgba(0,0,0,0.65)",
  },
};
export type Theme = typeof T.light;

// Cores de destaque da tela de entrada (login/Explorar), usadas em pequenos detalhes do app.
// Dourado e menta são decorativos: use sobre fundo escuro ou em ícones/bordas, não como texto sobre fundo claro.
export const DESTAQUE = {
  noite: "#0D2118",
  noiteMid: "#1A3D28",
  menta: "#7DD3A0",
  dourado: "#E8B840",
};

// ─── account model ────────────────────────────────────────────────────────────
export type Fase = "acumulando" | "recebendo";
export type Permissao = "saldo" | "aportes" | "investimentos" | "simulador" | "resgates";
export type PerfilRisco = "conservador" | "moderado" | "arrojado";
// Opções do Novo Plano FUSESC. Uma pessoa pode ter mais de uma (ex.: Meu Futuro e Meu Bem-Estar).
export type ProdutoId = "futuro" | "bemestar" | "pais" | "filhos";

// Uma conta = um plano de uma pessoa. "pessoa" agrupa os planos da mesma pessoa (0 = titular).
export type Conta = {
  id: number;
  pessoa: number;
  produto: ProdutoId;
  nome: string;
  initials: string;
  parentesco: "Titular" | "Pai" | "Mãe" | "Filho" | "Filha" | "Cônjuge";
  fase: Fase;
  saldo: number;
  aporteMensal: number;
  rendimento12m: number;
  meta: number;
  anoMeta: number;
  idadeAtual: number;
  anoAbertura: number;
  perfil: PerfilRisco;
  recorrenteAtiva: boolean;
  recorrenteDia: number;
  rendaMensal?: number;
  permissoes: Permissao[];
};

export const CONTAS_INICIAL: Conta[] = [
  {
    id: 0, pessoa: 0, produto: "futuro", nome: "Graciane Duarte Simões", initials: "GD", parentesco: "Titular",
    fase: "acumulando", saldo: 312840, aporteMensal: 1200, rendimento12m: 12.0,
    meta: 1200000, anoMeta: 2045, idadeAtual: 39, anoAbertura: 2018, perfil: "moderado",
    recorrenteAtiva: true, recorrenteDia: 1,
    permissoes: ["saldo", "aportes", "investimentos", "simulador", "resgates"],
  },
  {
    id: 1, pessoa: 1, produto: "pais", nome: "Artur Duarte", initials: "AD", parentesco: "Pai",
    fase: "recebendo", saldo: 487200, aporteMensal: 800, rendimento12m: 12.0,
    meta: 500000, anoMeta: 2020, idadeAtual: 68, anoAbertura: 2008, perfil: "conservador",
    recorrenteAtiva: true, recorrenteDia: 1, rendaMensal: 1950,
    permissoes: ["saldo", "aportes"],
  },
  {
    id: 2, pessoa: 2, produto: "pais", nome: "Lourdes Duarte", initials: "LD", parentesco: "Mãe",
    fase: "recebendo", saldo: 321500, aporteMensal: 600, rendimento12m: 12.0,
    meta: 350000, anoMeta: 2021, idadeAtual: 65, anoAbertura: 2010, perfil: "conservador",
    recorrenteAtiva: true, recorrenteDia: 5, rendaMensal: 1280,
    permissoes: ["saldo"],
  },
  {
    id: 3, pessoa: 3, produto: "filhos", nome: "Pedro Simões", initials: "PS", parentesco: "Filho",
    fase: "acumulando", saldo: 18400, aporteMensal: 400, rendimento12m: 12.0,
    meta: 800000, anoMeta: 2059, idadeAtual: 12, anoAbertura: 2021, perfil: "arrojado",
    recorrenteAtiva: true, recorrenteDia: 1, permissoes: ["saldo"],
  },
  {
    id: 4, pessoa: 4, produto: "filhos", nome: "Clara Simões", initials: "CS", parentesco: "Filha",
    fase: "acumulando", saldo: 9200, aporteMensal: 400, rendimento12m: 12.0,
    meta: 800000, anoMeta: 2062, idadeAtual: 9, anoAbertura: 2022, perfil: "arrojado",
    recorrenteAtiva: true, recorrenteDia: 1, permissoes: [],
  },
  {
    id: 5, pessoa: 0, produto: "bemestar", nome: "Graciane Duarte Simões", initials: "GD", parentesco: "Titular",
    fase: "recebendo", saldo: 380000, aporteMensal: 0, rendimento12m: 12.0,
    meta: 0, anoMeta: 2024, idadeAtual: 39, anoAbertura: 2024, perfil: "conservador",
    recorrenteAtiva: false, recorrenteDia: 1, rendaMensal: 2100,
    permissoes: ["saldo", "aportes", "investimentos", "simulador", "resgates"],
  },
];

export const can = (conta: Conta, perm: Permissao) => conta.pessoa === 0 || conta.permissoes.includes(perm);

export const PARENTESCO_COLOR: Record<string, string> = {
  Titular: "#2A5C40", Pai: "#5A4A8A", Mãe: "#8A4A6A",
  Filho: "#2A6A8A", Filha: "#7A5A2A", Cônjuge: "#C8962A",
};
export const PARENTESCO_COLOR_MID: Record<string, string> = {
  Titular: "#3A7A55", Pai: "#7060AA", Mãe: "#AA6080",
  Filho: "#3A80AA", Filha: "#9A7040", Cônjuge: "#D4A030",
};
export const PARENTESCO_COLOR_ACCENT: Record<string, string> = {
  Titular: "#4A9E6A", Pai: "#8878C8", Mãe: "#C27898",
  Filho: "#4A98C8", Filha: "#B88850", Cônjuge: "#E8B840",
};

// Alguns planos têm cor própria, para a troca de plano ser perceptível. Sem entrada aqui, vale a cor da pessoa.
// Meu Bem-Estar: verde-oliva, diferente do verde-escuro da titular e de todas as cores de parentesco.
export const COR_PRODUTO: Partial<Record<ProdutoId, { cor: string; mid: string; accent: string }>> = {
  bemestar: { cor: "#4F7A28", mid: "#6A9A38", accent: "#9CCB5C" },
};

type ComCor = Pick<Conta, "produto" | "parentesco">;
export const corConta = (c: ComCor) => COR_PRODUTO[c.produto]?.cor ?? PARENTESCO_COLOR[c.parentesco];
export const corContaMid = (c: ComCor) => COR_PRODUTO[c.produto]?.mid ?? PARENTESCO_COLOR_MID[c.parentesco];
export const corContaAccent = (c: ComCor) => COR_PRODUTO[c.produto]?.accent ?? PARENTESCO_COLOR_ACCENT[c.parentesco];

export const PERMISSOES_DEF: { id: Permissao; label: string; desc: string }[] = [
  { id: "saldo",         label: "Ver saldo",          desc: "Visualizar saldo e rendimentos" },
  { id: "aportes",       label: "Aportes",            desc: "Consultar histórico e fazer aportes" },
  { id: "investimentos", label: "Ver investimentos",  desc: "Acessar alocação e fundos" },
  { id: "simulador",     label: "Usar simulador",     desc: "Simular cenários de aposentadoria" },
  { id: "resgates",      label: "Solicitar resgates", desc: "Iniciar pedidos de resgate" },
];

export const PERFIL_LABEL: Record<PerfilRisco, string> = {
  conservador: "Conservador", moderado: "Moderado", arrojado: "Arrojado",
};

// ─── NOTIFICAÇÕES ─────────────────────────────────────────────────────────────
export type Notificacao = { id: number; titulo: string; corpo: string; lida: boolean; hora: string; icon: "rendimento" | "aporte" | "meta" | "nivel" };

export const NOTIFICACOES_INICIAL: Notificacao[] = [
  { id: 1, titulo: "Rendimento do mês", corpo: "Sua conta rendeu R$ 2.408,87 em agosto. +0,77% no período.", lida: false, hora: "Hoje, 08:15", icon: "rendimento" },
  { id: 2, titulo: "Aporte recebido", corpo: "Aporte recorrente de R$ 1.200,00 processado com sucesso.", lida: false, hora: "Hoje, 07:00", icon: "aporte" },
  { id: 3, titulo: "Meta em progresso", corpo: "Você atingiu 26% da sua meta de aposentadoria. Continue assim!", lida: true, hora: "Ontem, 18:30", icon: "meta" },
  { id: 4, titulo: "Nível de conta", corpo: "Complete o Nível 2 para aumentar seus limites de movimentação.", lida: true, hora: "28 ago", icon: "nivel" },
];

// ─── shared UI ────────────────────────────────────────────────────────────────
export function Card({ children, className = "", theme }: { children: ReactNode; className?: string; theme: Theme }) {
  return (
    <div className={`rounded-2xl border p-5 ${className}`}
      style={{ background: theme.surface, borderColor: theme.border, boxShadow: theme.shadow }}>
      {children}
    </div>
  );
}

export function Toggle({ on, onToggle, accent = "#2A5C40", off = "#C3CEC7", label }: {
  on: boolean; onToggle: () => void; accent?: string; off?: string; label: string;
}) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onToggle}
      className="relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 before:content-[''] before:absolute before:-inset-2.5"
      style={{ background: on ? accent : off }}>
      <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-300 shadow-sm"
        style={{ left: on ? "calc(100% - 22px)" : "2px" }} />
    </button>
  );
}

// ─── ALOCAÇÃO / FUNDOS ────────────────────────────────────────────────────────
// Fonte única de rentabilidade: cada fundo rende (fator × k) e k é calibrado para que a
// média ponderada da carteira seja exatamente conta.rendimento12m.
// CDI acumulado em 12 meses até 31/08/2026 (lâmina FUSESC).
export const CDI_12M = 14.63;

const FUNDS_BASE = [
  { name: "Renda Fixa",     color: "#2A5C40", fator: 0.75 },
  { name: "Multimercado",   color: "#C8962A", fator: 1.0 },
  { name: "Renda Variável", color: "#3A7A55", fator: 1.55 },
  { name: "Internacional",  color: "#A8C4B0", fator: 1.3 },
];

export const ALOCACOES: Record<PerfilRisco, number[]> = {
  conservador: [70, 20, 5, 5],
  moderado:    [45, 30, 15, 10],
  arrojado:    [25, 30, 30, 15],
};

export type Fund = { name: string; color: string; pct: number; ret: number };

export function getFunds(perfil: PerfilRisco, rendimento12m: number): Fund[] {
  const pcts = ALOCACOES[perfil];
  const w = FUNDS_BASE.reduce((s, f, i) => s + (pcts[i] / 100) * f.fator, 0);
  const k = rendimento12m / w;
  return FUNDS_BASE.map((f, i) => ({
    name: f.name, color: f.color, pct: pcts[i], ret: Math.round(k * f.fator * 10) / 10,
  }));
}

// ─── DONUT ────────────────────────────────────────────────────────────────────
export function Donut({ theme, saldo, hidden, funds }: { theme: Theme; saldo: number; hidden: boolean; funds: Fund[] }) {
  const r = 50, sz = 130, cx = sz / 2, cy = sz / 2, circ = 2 * Math.PI * r;
  let off = 0;
  const slices = funds.map((f) => {
    const dash = (f.pct / 100) * circ;
    const s = { ...f, dash, off };
    off += dash;
    return s;
  });
  // Valor completo com centavos; o "R$" vai na linha de cima para caber no centro do gráfico.
  const label = hidden ? "••••" : saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    <div className="flex items-center gap-5">
      <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`} role="img"
        aria-label={`Alocação: ${funds.map((f) => `${f.name} ${f.pct}%`).join(", ")}`}>
        {slices.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={20}
            strokeDasharray={`${s.dash} ${circ - s.dash}`}
            strokeDashoffset={-s.off + circ * 0.25} />
        ))}
        <text x={cx} y={cy - 7} textAnchor="middle" fontSize="10" fill={theme.muted} fontFamily="Inter">total R$</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="11" fontWeight="700" fill={theme.text} fontFamily="Inter">{label}</text>
      </svg>
      <div className="flex flex-col gap-2.5">
        {funds.map((f) => (
          <div key={f.name} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: f.color }} />
            <span className="text-xs" style={{ color: theme.muted }}>{f.name}</span>
            <span className="text-xs font-semibold ml-auto pl-3" style={{ color: theme.text }}>{f.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
