import { COR_PRODUTO, Icon, PARENTESCO_COLOR, type Theme } from "../shared";
import { APORTE_MINIMO, PLANOS, brl0 } from "../lib/explorar";
import { PLANO } from "../lib/regras";

export default function PlanosSheet({ theme, onSignup }: { theme: Theme; onSignup: () => void }) {
  return (
    <div>
      <p className="text-lg font-bold pr-10" style={{ color: theme.text }}>{PLANO.nome}</p>
      <p className="text-sm mb-4" style={{ color: theme.muted }}>
        Opções para você e para a sua família · {PLANO.modalidade} · aporte a partir de {brl0(APORTE_MINIMO)}
      </p>
      <div className="space-y-3">
        {PLANOS.map((p) => {
          const cor = COR_PRODUTO[p.id]?.cor ?? PARENTESCO_COLOR[p.parentesco];
          return (
            <div key={p.id} className="rounded-2xl p-5" style={{ border: `1px solid ${theme.border}`, borderLeft: `4px solid ${cor}`, background: theme.surface }}>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: cor }}>{p.chamada}</p>
              <p className="text-lg font-bold mt-0.5" style={{ color: theme.text }}>{p.nome}</p>
              <p className="text-sm mt-2 leading-relaxed" style={{ color: theme.text }}>{p.resumo}</p>
              <ul className="mt-3 space-y-1.5">
                {p.pontos.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-xs" style={{ color: theme.muted }}>
                    <span className="mt-0.5 flex-shrink-0" style={{ color: theme.positive }}><Icon.Check /></span> {b}
                  </li>
                ))}
              </ul>
              <p className="text-xs mt-3 pt-3" style={{ color: theme.muted, borderTop: `1px solid ${theme.rowBorder}` }}>
                {p.sugestaoMensal > 0
                  ? <>Sugestão: <strong style={{ color: theme.text }}>{brl0(p.sugestaoMensal)}/mês</strong> por {p.sugestaoAnos} anos</>
                  : "Simulação feita com a equipe da FUSESC, conforme o seu patrimônio e a sua idade"}
              </p>
            </div>
          );
        })}
      </div>
      <button onClick={onSignup} className="w-full min-h-12 py-3.5 rounded-2xl text-sm font-bold text-white mt-5" style={{ background: theme.accent }}>
        Quero começar: pré-cadastro em 30s
      </button>
    </div>
  );
}
