import { useState } from "react";
import { ALOCACOES, Donut, PERFIL_LABEL, getFunds, type Conta, type PerfilRisco, type Theme } from "../shared";

const OPCOES: { id: PerfilRisco; desc: string }[] = [
  { id: "conservador", desc: "Prioriza segurança e previsibilidade. Menor oscilação, retorno mais moderado." },
  { id: "moderado",    desc: "Equilibra segurança e crescimento. Aceita oscilações moderadas no curto prazo." },
  { id: "arrojado",    desc: "Foco no longo prazo. Aceita oscilações maiores em busca de maior retorno." },
];

export default function PerfilInvestSheet({ theme, conta, hidden, onClose, onSave }: {
  theme: Theme; conta: Conta; hidden: boolean; onClose: () => void; onSave: (perfil: PerfilRisco) => void;
}) {
  const [sel, setSel] = useState<PerfilRisco>(conta.perfil);
  const funds = getFunds(sel, conta.rendimento12m);

  return (
    <div className="flex flex-col">
      <p className="text-base font-bold mb-1 pr-10" style={{ color: theme.text }}>Perfil de investimento</p>
      <p className="text-xs mb-5" style={{ color: theme.muted }}>
        A alocação da carteira de {conta.nome.split(" ")[0]} acompanha o perfil escolhido.
      </p>

      <div role="radiogroup" aria-label="Perfil de investimento" className="space-y-2 mb-5">
        {OPCOES.map((o) => {
          const on = sel === o.id;
          return (
            <button key={o.id} role="radio" aria-checked={on} onClick={() => setSel(o.id)}
              className="w-full flex items-start gap-3 rounded-2xl p-4 text-left"
              style={{ background: on ? theme.tagBg : theme.inputBg, border: `2px solid ${on ? theme.accent : theme.border}` }}>
              <span className="w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                style={{ borderColor: on ? theme.accent : theme.border }}>
                {on && <span className="w-2.5 h-2.5 rounded-full" style={{ background: theme.accent }} />}
              </span>
              <span>
                <span className="block text-sm font-semibold" style={{ color: theme.text }}>
                  {PERFIL_LABEL[o.id]}
                  {conta.perfil === o.id && <span className="ml-2 text-xs font-medium" style={{ color: theme.muted }}>atual</span>}
                </span>
                <span className="block text-xs mt-0.5" style={{ color: theme.muted }}>{o.desc}</span>
                <span className="block text-xs mt-1.5 font-medium" style={{ color: theme.accentText }}>
                  {["Renda Fixa", "Multimercado", "Renda Variável", "Internacional"].map((n, i) => `${n} ${ALOCACOES[o.id][i]}%`).join(" · ")}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-xs font-semibold tracking-wide uppercase mb-3" style={{ color: theme.muted }}>Prévia da alocação</p>
      <div className="mb-5">
        <Donut theme={theme} saldo={conta.saldo} hidden={hidden} funds={funds} />
      </div>

      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 min-h-12 py-3.5 rounded-2xl text-sm font-semibold"
          style={{ background: theme.inputBg, color: theme.text }}>
          Cancelar
        </button>
        <button onClick={() => onSave(sel)} disabled={sel === conta.perfil}
          className="flex-1 min-h-12 py-3.5 rounded-2xl text-white text-sm font-bold disabled:opacity-50"
          style={{ background: theme.accent }}>
          Salvar perfil
        </button>
      </div>
    </div>
  );
}
