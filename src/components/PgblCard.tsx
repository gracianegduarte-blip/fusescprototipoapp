import { useState } from "react";
import { Card, Icon, brl, type Theme } from "../shared";
import { digitsToCents, fmtMoneyCents } from "../lib/format";
import { PLANO } from "../lib/regras";

const FAIXAS = [
  { v: 0.15, l: "15%" },
  { v: 0.225, l: "22,5%" },
  { v: 0.275, l: "27,5%" },
];

export default function PgblCard({ theme, aporteMensal }: { theme: Theme; aporteMensal: number }) {
  const [rendaCents, setRendaCents] = useState(9600000);
  const [aliquota, setAliquota] = useState(0.225);

  const renda = rendaCents / 100;
  const limite = renda * (PLANO.deducaoIrPct / 100);
  const aporteAnual = aporteMensal * 12;
  const dedutivel = Math.min(aporteAnual, limite);
  const economia = dedutivel * aliquota;
  const aporteIdeal = limite / 12;
  const usaTudo = aporteAnual >= limite;

  return (
    <Card theme={theme}>
      <div className="flex items-center gap-2 mb-1">
        <span style={{ color: theme.accentText }}><Icon.Shield size={18} /></span>
        <p className="text-sm font-semibold" style={{ color: theme.text }}>Dedução no Imposto de Renda</p>
      </div>
      <p className="text-xs mb-4" style={{ color: theme.muted }}>
        Suas contribuições ao plano podem ser deduzidas da base do IR até {PLANO.deducaoIrPct}% da renda bruta anual. Veja quanto isso vale para você.
      </p>

      <label htmlFor="pgbl-renda" className="block text-xs font-medium mb-1.5" style={{ color: theme.muted }}>Renda bruta anual</label>
      <div className="flex items-center rounded-2xl px-4 h-12 mb-4" style={{ background: theme.inputBg, border: `1.5px solid ${theme.border}` }}>
        <span className="text-sm font-semibold mr-2" style={{ color: theme.muted }}>R$</span>
        <input id="pgbl-renda" inputMode="numeric" autoComplete="off" value={fmtMoneyCents(rendaCents)}
          onChange={(e) => setRendaCents(digitsToCents(e.target.value, 100000000000))}
          className="flex-1 min-w-0 bg-transparent text-sm font-semibold outline-none" style={{ color: theme.text }} />
      </div>

      <p className="text-xs font-medium mb-1.5" style={{ color: theme.muted }} id="pgbl-faixa">Sua faixa de IR (alíquota marginal)</p>
      <div role="radiogroup" aria-labelledby="pgbl-faixa" className="grid grid-cols-3 gap-2 mb-4">
        {FAIXAS.map((f) => (
          <button key={f.l} role="radio" aria-checked={aliquota === f.v} onClick={() => setAliquota(f.v)}
            className="min-h-11 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: aliquota === f.v ? theme.accent : theme.inputBg, color: aliquota === f.v ? "#fff" : theme.text }}>
            {f.l}
          </button>
        ))}
      </div>

      <div className="rounded-2xl p-4 space-y-2.5" style={{ background: theme.positiveBg }}>
        <div className="flex justify-between text-xs" style={{ color: theme.muted }}>
          <span>Limite dedutível ({PLANO.deducaoIrPct}%)</span><strong style={{ color: theme.text }}>{brl(limite)}</strong>
        </div>
        <div className="flex justify-between text-xs" style={{ color: theme.muted }}>
          <span>Seus aportes em 12 meses</span><strong style={{ color: theme.text }}>{brl(aporteAnual)}</strong>
        </div>
        <div className="flex justify-between items-baseline pt-2" style={{ borderTop: `1px solid ${theme.border}` }}>
          <span className="text-xs font-semibold" style={{ color: theme.text }}>Economia estimada no IR</span>
          <strong className="text-lg" style={{ color: theme.positive }}>{brl(economia)}</strong>
        </div>
      </div>
      <p className="text-xs mt-3 leading-relaxed" style={{ color: theme.muted }}>
        {usaTudo
          ? "Você já aproveita todo o limite de dedução."
          : `Para aproveitar o limite todo, aporte cerca de ${brl(aporteIdeal)} por mês.`}
        {" "}Vale para quem faz a declaração completa e contribui para o INSS ou regime próprio. O IR é pago depois, ao receber o benefício. Estimativa ilustrativa: consulte um contador.
      </p>
    </Card>
  );
}
