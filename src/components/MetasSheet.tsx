import { useMemo, useState } from "react";
import { Icon, type Theme } from "../shared";
import {
  APORTE_MINIMO, OBJETIVOS, brl0, economiaIrAnual, simularMeta,
  type CenarioId, type MetaRascunho, type Objetivo,
} from "../lib/explorar";
import { AVISO_RENTABILIDADE, PLANO } from "../lib/regras";
import Ajustado from "./Ajustado";

function Slider({ theme, id, label, value, min, max, step, fmt, onChange }: {
  theme: Theme; id: string; label: string; value: number; min: number; max: number; step: number;
  fmt: (v: number) => string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label htmlFor={id} className="text-xs font-medium" style={{ color: theme.muted }}>{label}</label>
        <span className="text-sm font-bold" style={{ color: theme.accentText }}>{fmt(value)}</span>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value}
        aria-valuetext={fmt(value)} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

export default function MetasSheet({ theme, onSignup }: { theme: Theme; onSignup: (meta: MetaRascunho) => void }) {
  const [obj, setObj] = useState<Objetivo | null>(null);
  const [meta, setMeta] = useState(0);
  const [anos, setAnos] = useState(0);
  const [mensal, setMensal] = useState(500);
  const [sel, setSel] = useState<CenarioId>("evolutivo");

  const cenarios = useMemo(() => (obj ? simularMeta(mensal, meta, anos) : []), [obj, mensal, meta, anos]);

  if (!obj) {
    return (
      <div>
        <p className="text-lg font-bold pr-10" style={{ color: theme.text }}>Simulador de metas</p>
        <p className="text-sm mb-4" style={{ color: theme.muted }}>Qual é o seu objetivo? Você ajusta os números em seguida.</p>
        <div className="space-y-2">
          {OBJETIVOS.map((o) => (
            <button key={o.id} onClick={() => { setObj(o); setMeta(o.meta); setAnos(o.anos); }}
              className="w-full min-h-14 flex items-center gap-3 rounded-2xl px-4 py-3 text-left"
              style={{ background: theme.inputBg, border: `1px solid ${theme.border}` }}>
              <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: theme.accentTag, color: theme.accentText }}>
                <Icon.Target size={18} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold" style={{ color: theme.text }}>{o.titulo}</span>
                <span className="block text-xs" style={{ color: theme.muted }}>{brl0(o.meta)} em {o.anos} anos</span>
              </span>
              <span style={{ color: theme.muted }}><Icon.ChevronRight /></span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const c = cenarios.find((x) => x.id === sel)!;
  const atinge = c.saldoFinal >= meta;

  return (
    <div>
      <button onClick={() => setObj(null)} className="min-h-11 flex items-center gap-1 text-sm font-semibold mb-1" style={{ color: theme.accentText }}>
        <Icon.ChevronLeft /> Trocar objetivo
      </button>
      <p className="text-lg font-bold mb-4" style={{ color: theme.text }}>{obj.titulo}</p>

      <div className="space-y-6 mb-6">
        <Slider theme={theme} id="meta-valor" label="Quanto quero juntar" value={meta} min={10_000} max={2_000_000} step={10_000} fmt={brl0} onChange={setMeta} />
        <Slider theme={theme} id="meta-anos" label="Em quanto tempo" value={anos} min={2} max={40} step={1} fmt={(v) => `${v} anos`} onChange={setAnos} />
        <Slider theme={theme} id="meta-mensal" label="Quanto posso aportar por mês" value={mensal} min={APORTE_MINIMO} max={5000} step={10} fmt={brl0} onChange={setMensal} />
      </div>

      <p className="text-xs font-semibold mb-2" style={{ color: theme.muted }}>Cenários</p>
      <div className="grid grid-cols-3 gap-2 mb-4" role="radiogroup" aria-label="Cenários">
        {cenarios.map((x) => {
          const ativo = x.id === sel;
          return (
            <button key={x.id} role="radio" aria-checked={ativo} onClick={() => setSel(x.id)}
              className="relative rounded-2xl p-3 pt-4 text-left min-w-0"
              style={{ background: ativo ? theme.accentTag : theme.inputBg, border: `1.5px solid ${ativo ? theme.accentText : theme.border}` }}>
              {x.id === "evolutivo" && (
                <span className="absolute -top-2 left-2 text-xs font-bold uppercase px-1.5 py-0.5 rounded-full text-white" style={{ background: theme.accent }}>
                  Sugerido
                </span>
              )}
              <span className="block text-xs font-semibold leading-tight mb-1" style={{ color: theme.muted }}>{x.label}</span>
              <Ajustado className="text-sm font-bold leading-tight" style={{ color: theme.text }}>{brl0(x.saldoFinal)}</Ajustado>
            </button>
          );
        })}
      </div>

      <div className="rounded-3xl p-5 text-white mb-4" style={{ background: `linear-gradient(145deg, ${theme.accent}, ${theme.accentMid})` }}>
        <p className="text-xs uppercase tracking-wide text-white/85 mb-1">{c.hint}</p>
        <Ajustado className="text-2xl font-bold mb-1">{brl0(c.saldoFinal)}</Ajustado>
        <p className="text-xs text-white/85 mb-4">
          {atinge ? "Você atinge a sua meta." : `Faltam ${brl0(meta - c.saldoFinal)} para a meta.`}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { l: "Aporte mensal", v: brl0(c.primeiroAporte), sub: c.ultimoAporte !== c.primeiroAporte ? `sobe até ${brl0(c.ultimoAporte)}` : undefined },
            { l: "Total aportado", v: brl0(c.totalAportado) },
            { l: "Renda estimada", v: `${brl0(c.rendaMensal)}/mês` },
            { l: "Economia no IR/ano", v: brl0(economiaIrAnual(c.primeiroAporte)) },
          ].map((s: { l: string; v: string; sub?: string }) => (
            <div key={s.l} className="rounded-2xl p-3 min-w-0" style={{ background: "rgba(255,255,255,0.14)" }}>
              <p className="text-xs text-white/85 mb-0.5">{s.l}</p>
              <Ajustado className="text-sm font-bold">{s.v}</Ajustado>
              {s.sub && <Ajustado className="text-xs text-white/85 mt-0.5">{s.sub}</Ajustado>}
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-center mb-4" style={{ color: theme.muted }}>
        Estimativa com {String(PLANO.rentabilidadeSimulacao * 100).replace(".", ",")}% a.a. e renda de {String(PLANO.rendaPercentualMin).replace(".", ",")}% do saldo ao mês. {AVISO_RENTABILIDADE}
      </p>

      <button onClick={() => onSignup({ objetivo: obj.titulo, meta, anos, mensal: c.primeiroAporte })}
        className="w-full min-h-12 py-3.5 rounded-2xl text-sm font-bold text-white" style={{ background: theme.accent }}>
        Transformar em meta real
      </button>
    </div>
  );
}
