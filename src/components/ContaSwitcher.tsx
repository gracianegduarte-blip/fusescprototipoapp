import { Icon, type Conta, type Theme, corConta } from "../shared";
import { PRODUTOS } from "../lib/produtos";
import { IconeProduto, resumoPlano } from "./MeusPlanos";

export default function ContaSwitcher({ contas, contaAtiva, theme, onSelect, onClose, hidden }: {
  contas: Conta[]; contaAtiva: number; theme: Theme;
  onSelect: (id: number) => void; onClose: () => void; hidden: boolean;
}) {
  const grupos = [
    { label: "Meus planos", ids: contas.filter((c) => c.pessoa === 0).map((c) => c.id) },
    { label: "Meus pais", ids: contas.filter((c) => c.pessoa !== 0 && (c.parentesco === "Pai" || c.parentesco === "Mãe")).map((c) => c.id) },
    { label: "Meus filhos", ids: contas.filter((c) => c.pessoa !== 0 && (c.parentesco === "Filho" || c.parentesco === "Filha")).map((c) => c.id) },
    { label: "Cônjuge", ids: contas.filter((c) => c.pessoa !== 0 && c.parentesco === "Cônjuge").map((c) => c.id) },
  ].filter((g) => g.ids.length > 0);

  return (
    <div className="flex flex-col">
      <p className="text-base font-bold mb-1 pr-10" style={{ color: theme.text }}>Trocar de plano ou pessoa</p>
      <p className="text-xs mb-5" style={{ color: theme.muted }}>Selecione para visualizar e gerenciar</p>

      <div className="space-y-4">
        {grupos.map((grupo) => (
          <div key={grupo.label}>
            <p className="text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: theme.muted }}>
              {grupo.label}
            </p>
            <div className="space-y-2">
              {grupo.ids.map((id) => {
                const c = contas.find((x) => x.id === id)!;
                const cor = corConta(c);
                const ativa = id === contaAtiva;
                return (
                  <button key={id} onClick={() => { onSelect(id); onClose(); }} aria-current={ativa ? "true" : undefined}
                    className="w-full flex items-center gap-3 rounded-2xl p-4 text-left transition-all"
                    style={{
                      background: ativa ? theme.tagBg : theme.inputBg,
                      border: `1.5px solid ${ativa ? theme.accent : theme.border}`,
                    }}>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ background: cor }}>
                      {c.pessoa === 0 ? <IconeProduto produto={c.produto} /> : c.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: theme.text }}>
                        {c.pessoa === 0 ? PRODUTOS[c.produto].nome : c.nome}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs" style={{ color: theme.muted }}>{c.pessoa === 0 ? "Titular" : PRODUTOS[c.produto].nome}</span>
                        <span className="w-1 h-1 rounded-full" style={{ background: theme.muted }} />
                        <span className="text-xs font-medium" style={{ color: theme.accentText }}>
                          {c.fase === "recebendo" ? "Recebendo" : "Acumulando"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold" style={{ color: theme.text }}>{resumoPlano(c, hidden)}</p>
                      <p className="text-xs" style={{ color: theme.muted }}>{c.fase === "recebendo" && c.rendaMensal ? "renda" : "saldo"}</p>
                    </div>
                    {ativa && (
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-white flex-shrink-0"
                        style={{ background: theme.accent }}>
                        <Icon.Check />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl p-4 flex items-center gap-3"
        style={{ background: theme.inputBg, border: `1px dashed ${theme.border}` }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: theme.tagBg, color: theme.accentText }}>
          <Icon.Plus size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: theme.accentText }}>Adicionar conta familiar</p>
          <p className="text-xs" style={{ color: theme.muted }}>Criar previdência para um familiar</p>
        </div>
      </div>
    </div>
  );
}
