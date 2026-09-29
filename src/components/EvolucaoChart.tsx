import { useId, useMemo, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Card, MASK, brl, pct1, type Theme } from "../shared";

const MESES = ["Set/25", "Out/25", "Nov/25", "Dez/25", "Jan/26", "Fev/26", "Mar/26", "Abr/26", "Mai/26", "Jun/26", "Jul/26", "Ago/26"];
const EIXO = [0, 3, 6, 9, 11];
const W = 300, H = 84, PAD = 6;

export default function EvolucaoChart({ theme, cor, saldo, rendimento12m, hidden }: {
  theme: Theme; cor: string; saldo: number; rendimento12m: number; hidden: boolean;
}) {
  const gid = useId();
  const n = MESES.length;
  const [active, setActive] = useState(n - 1);

  const values = useMemo(() => {
    const base = saldo / (1 + rendimento12m / 100);
    return MESES.map((_, i) => {
      const t = i / (n - 1);
      return Math.round(base + (saldo - base) * (t * (2 - t)));
    });
  }, [saldo, rendimento12m, n]);

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const x = (i: number) => PAD + (i / (n - 1)) * (W - PAD * 2);
  const y = (v: number) => H - PAD - ((v - min) / range) * (H - PAD * 2);
  const line = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${x(0)},${H} ${line} ${x(n - 1)},${H}`;

  const move = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = (e.clientX - rect.left) / rect.width;
    setActive(Math.max(0, Math.min(n - 1, Math.round(rel * (n - 1)))));
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    if (e.key === "ArrowRight") { e.preventDefault(); setActive((a) => Math.min(n - 1, a + 1)); }
  };

  const resumo = hidden
    ? `Saldo subiu ${pct1(rendimento12m)}% nos últimos 12 meses.`
    : `Saldo subiu ${pct1(rendimento12m)}% nos últimos 12 meses, de ${brl(values[0])} para ${brl(values[n - 1])}. Em ${MESES[active]}: ${brl(values[active])}.`;

  return (
    <Card theme={theme}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-semibold" style={{ color: theme.text }}>Evolução do saldo — 12 meses</p>
        <span className="text-xs font-semibold" style={{ color: theme.positive }}>+{pct1(rendimento12m)}%</span>
      </div>
      <p className="text-xs mb-3" style={{ color: theme.muted }} aria-live="polite">
        {MESES[active]} · <strong style={{ color: theme.text }}>{hidden ? MASK : brl(values[active])}</strong>
      </p>

      <div tabIndex={0} role="img" aria-label={resumo}
        className="w-full rounded-lg outline-offset-4 cursor-crosshair"
        style={{ touchAction: "pan-y" }}
        onPointerMove={move} onPointerDown={move}
        onPointerLeave={() => setActive(n - 1)} onKeyDown={onKey}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" fill="none" style={{ overflow: "visible" }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={cor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={cor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={area} fill={`url(#${gid})`} />
          <polyline points={line} stroke={cor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <line x1={x(active)} x2={x(active)} y1={PAD} y2={H} stroke={theme.border} strokeWidth="1" />
          <circle cx={x(active)} cy={y(values[active])} r="4" fill={cor} stroke={theme.surface} strokeWidth="2" />
        </svg>
      </div>

      <div className="relative h-5 mt-2" aria-hidden="true">
        {EIXO.map((i) => (
          <span key={i} className="absolute text-xs whitespace-nowrap"
            style={{
              left: `${(x(i) / W) * 100}%`, color: theme.muted,
              transform: i === 0 ? "none" : i === n - 1 ? "translateX(-100%)" : "translateX(-50%)",
            }}>
            {MESES[i]}
          </span>
        ))}
      </div>
    </Card>
  );
}
