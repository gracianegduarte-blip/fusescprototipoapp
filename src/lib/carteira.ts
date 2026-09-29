// Dados reais da carteira da FUSESC, usados como referência até o novo plano ter histórico próprio.
// Fonte: Lâmina do Plano Multifuturo II de 31/08/2026 (fusesc.com.br/investimentos).
// Atualize a cada nova lâmina mensal.

export const REFERENCIA = {
  plano: "Plano Multifuturo II",
  data: "31/08/2026",
  mes: "agosto/2026",
  lamina: "https://fusesc.com.br/wp-content/uploads/2026/09/Lamina-do-Plano-Multifuturo-2-31.08.2026.pdf",
  totalInvestido: 409_216_681.2,
};

export const RENTABILIDADE = { mes: 0.77, ano: 7.97, m12: 12.0, m24: 23.87, m36: 35.62, m48: 50.34, m60: 69.17 };

export type Periodo = "m12" | "m36" | "m60";
export const PERIODO_LABEL: Record<Periodo, string> = { m12: "12 meses", m36: "3 anos", m60: "5 anos" };

// Rentabilidade acumulada do plano x indicadores (%).
export const COMPARATIVO: { nome: string; plano?: boolean; m12: number; m36: number; m60: number }[] = [
  { nome: "Plano FUSESC", plano: true, m12: 12.0, m36: 35.62, m60: 69.17 },
  { nome: "CDI", m12: 14.63, m36: 43.89, m60: 80.11 },
  { nome: "Ibovespa", m12: 25.44, m36: 53.24, m60: 49.3 },
  { nome: "IMA-B", m12: 11.01, m36: 22.3, m60: 46.83 },
  { nome: "Poupança", m12: 8.33, m36: 25.15, m60: 44.76 },
  { nome: "Meta atuarial", m12: 8.13, m36: 27.91, m60: 58.94 },
  { nome: "IPCA", m12: 4.22, m36: 14.21, m60: 29.9 },
];

export type Segmento = {
  nome: string; pct: number; milhoes: number; mes: number | null; cor: string; desc: string;
  composicao?: { nome: string; pct: number }[];
};

export const SEGMENTOS: Segmento[] = [
  {
    nome: "Renda Fixa", pct: 88.87, milhoes: 363.64, mes: 0.74, cor: "#2A5C40",
    desc: "Principalmente títulos públicos, com retorno previsível e menor oscilação.",
    composicao: [
      { nome: "Atrelados ao IPCA", pct: 50.81 },
      { nome: "Pós-fixados", pct: 30.26 },
      { nome: "Prefixados", pct: 14.11 },
      { nome: "Atrelados ao IGP-M", pct: 4.82 },
    ],
  },
  {
    nome: "Estruturados", pct: 6.6, milhoes: 27.01, mes: 1.78, cor: "#C8962A",
    desc: "Fundos multimercado que combinam estratégias para diversificar.",
    composicao: [
      { nome: "Exterior, fundos e opções", pct: 57 },
      { nome: "Títulos públicos", pct: 32 },
      { nome: "Cotas de renda variável", pct: 10 },
      { nome: "Títulos privados", pct: 1 },
    ],
  },
  {
    nome: "Imobiliário", pct: 2.49, milhoes: 10.21, mes: 0.16, cor: "#3A7A55",
    desc: "Imóveis e fundos imobiliários que geram renda de aluguel.",
  },
  {
    nome: "Empréstimos a participantes", pct: 2.04, milhoes: 8.36, mes: 0.73, cor: "#A8C4B0",
    desc: "Empréstimos aos próprios participantes. Os juros voltam para o plano.",
  },
];

export const SEM_ALOCACAO = ["Renda variável direta", "Investimentos no exterior"];

export const PRESTADORES = [
  { papel: "Custódia e controladoria", nome: "Itaú Unibanco" },
  { papel: "Consultoria de risco", nome: "Aditus" },
  { papel: "Auditoria independente", nome: "BEZ Auditores Independentes" },
];

export const AVISO_GARANTIA =
  "Os investimentos não contam com garantia da FUSESC, das patrocinadoras, dos gestores, de seguro ou do Fundo Garantidor de Créditos (FGC).";

export const fmtPct = (v: number, casas = 2) => `${v.toFixed(casas).replace(".", ",")}%`;
