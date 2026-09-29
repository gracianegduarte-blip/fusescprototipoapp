import { useState } from "react";
import { Icon, MASK, brl, type Conta, type Theme } from "../shared";
import { digitsToCents, duracaoRenda, fmtMoneyCents } from "../lib/format";

const MIN = 500;

export default function RendaSheet({ theme, conta, hidden, initial, onClose, onSave }: {
  theme: Theme; conta: Conta; hidden: boolean; initial?: number; onClose: () => void; onSave: (renda: number) => void;
}) {
  const atual = conta.rendaMensal ?? 0;
  const max = Math.round((conta.saldo * 0.03) / 10) * 10;
  const [cents, setCents] = useState(Math.round((initial ?? atual) * 100));
  const v = cents / 100;
  const invalido = v < MIN ? `Renda mínima: ${brl(MIN)}` : v > max ? `Renda máxima permitida: ${brl(max)}` : "";
  const dur = duracaoRenda(conta.saldo, v);
  const mascara = (n: number) => (hidden ? MASK : brl(n));

  return (
    <div className="flex flex-col">
      <p className="text-base font-bold mb-1 pr-10" style={{ color: theme.text }}>Alterar renda mensal</p>
      <p className="text-xs mb-5" style={{ color: theme.muted }}>
        Renda atual: <strong style={{ color: theme.text }}>{mascara(atual)}</strong> · {conta.nome}
      </p>

      <label htmlFor="nova-renda" className="block text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: theme.muted }}>
        Nova renda mensal
      </label>
      <div className="flex items-center rounded-2xl border-2 px-5 py-4 mb-1"
        style={{ borderColor: invalido ? theme.danger : theme.accent, background: theme.inputBg }}>
        <span className="text-base font-semibold mr-2" style={{ color: theme.muted }}>R$</span>
        <input id="nova-renda" inputMode="numeric" autoComplete="off" value={fmtMoneyCents(cents)}
          onChange={(e) => setCents(digitsToCents(e.target.value, 100000000))}
          aria-invalid={!!invalido} aria-describedby="nova-renda-msg"
          className="flex-1 min-w-0 bg-transparent text-2xl font-bold outline-none tracking-tight"
          style={{ color: theme.text }} />
      </div>
      <p id="nova-renda-msg" className="text-xs mb-4" role={invalido ? "alert" : undefined}
        style={{ color: invalido ? theme.danger : theme.muted }}>
        {invalido || `Entre ${brl(MIN)} e ${brl(max)} (até 3% do saldo por mês).`}
      </p>

      <div className="rounded-2xl p-4 mb-5 flex items-start gap-3" style={{ background: theme.inputBg, border: `1px solid ${theme.border}` }}>
        <span style={{ color: theme.accentText }} className="mt-0.5"><Icon.Info /></span>
        <p className="text-xs leading-relaxed" style={{ color: theme.muted }}>
          {dur === null
            ? "Com essa renda, o saldo rende mais do que você retira: o benefício pode durar indefinidamente."
            : `Com essa renda e rentabilidade de 9% a.a., o saldo dura cerca de ${Math.round(dur)} ${Math.round(dur) === 1 ? "ano" : "anos"}.`}
          {" "}A alteração vale a partir do próximo pagamento.
        </p>
      </div>

      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 min-h-12 py-3.5 rounded-2xl text-sm font-semibold"
          style={{ background: theme.inputBg, color: theme.text }}>
          Cancelar
        </button>
        <button onClick={() => { if (!invalido) onSave(v); }} aria-disabled={!!invalido}
          className="flex-1 min-h-12 py-3.5 rounded-2xl text-white text-sm font-bold"
          style={{ background: invalido ? theme.switchOff : theme.accent }}>
          Confirmar
        </button>
      </div>
    </div>
  );
}
