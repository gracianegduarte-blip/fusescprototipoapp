import { DESTAQUE, Icon, MASK, brl, type Conta, type ProdutoId, type Theme } from "../shared";
import { PRODUTOS } from "../lib/produtos";

export function IconeProduto({ produto, size = 20 }: { produto: ProdutoId; size?: number }) {
  if (produto === "futuro") return <Icon.Trend size={size} />;
  if (produto === "bemestar") return <Icon.Wallet size={size} />;
  if (produto === "pais") return <Icon.Shield size={size} />;
  return <Icon.Star size={size} />;
}

// Resumo de uma linha do plano: saldo de quem acumula, renda de quem recebe.
export const resumoPlano = (c: Conta, hidden: boolean) =>
  c.fase === "recebendo" && c.rendaMensal
    ? `${hidden ? "••••" : brl(c.rendaMensal)}/mês`
    : hidden ? MASK : brl(c.saldo);

// Topo da tela Início do titular: todos os planos dele e o total. Os familiares ficam no seletor do topo.
export default function MeusPlanos({ theme, contas, contaAtiva, hidden, onSelect, onConhecer }: {
  theme: Theme; contas: Conta[]; contaAtiva: number; hidden: boolean;
  onSelect: (id: number) => void; onConhecer: (produto: ProdutoId) => void;
}) {
  const meus = contas.filter((c) => c.pessoa === 0);
  const total = meus.reduce((s, c) => s + c.saldo, 0);
  const faltando = (["futuro", "bemestar"] as ProdutoId[]).filter((p) => !meus.some((c) => c.produto === p));

  return (
    <section aria-label="Meus planos" className="space-y-3">
      <div className="flex items-baseline justify-between px-1">
        <p className="text-sm font-bold" style={{ color: theme.text }}>Meus planos</p>
        {meus.length > 1 && (
          <p className="text-xs" style={{ color: theme.muted }}>
            Total <strong style={{ color: theme.text }}>{hidden ? MASK : brl(total)}</strong>
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Plano exibido">
        {meus.map((c) => {
          const ativo = c.id === contaAtiva;
          const p = PRODUTOS[c.produto];
          return (
            <button key={c.id} role="radio" aria-checked={ativo} onClick={() => onSelect(c.id)}
              className="relative rounded-2xl p-3 text-left transition-all min-h-[88px]"
              style={{
                background: ativo ? theme.tagBg : theme.surface,
                border: `1.5px solid ${ativo ? theme.accent : theme.border}`,
                boxShadow: theme.shadow,
              }}>
              {ativo && (
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center" aria-hidden="true"
                  style={{ background: DESTAQUE.menta, color: DESTAQUE.noite, boxShadow: `0 0 0 2px ${theme.bg}` }}>
                  <Icon.Check size={12} sw={3} />
                </span>
              )}
              <span className="flex items-center justify-between mb-1.5">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: theme.tagBg, color: theme.accentText }}>
                  <IconeProduto produto={c.produto} size={16} />
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: theme.tagBg, color: theme.accentText }}>
                  {c.fase === "recebendo" ? "Recebendo" : "Acumulando"}
                </span>
              </span>
              <span className="block text-sm font-bold" style={{ color: theme.text }}>{p.nome}</span>
              <span className="block text-xs" style={{ color: theme.muted }}>{resumoPlano(c, hidden)}</span>
            </button>
          );
        })}
        {faltando.map((pid) => (
          <button key={pid} onClick={() => onConhecer(pid)}
            className="rounded-2xl p-3 text-left min-h-[88px] border-2 border-dashed"
            style={{ borderColor: theme.border, background: "transparent" }}>
            <span className="w-8 h-8 rounded-lg flex items-center justify-center mb-1.5" style={{ background: theme.inputBg, color: theme.accentText }}>
              <Icon.Plus size={16} />
            </span>
            <span className="block text-sm font-bold" style={{ color: theme.accentText }}>Conhecer {PRODUTOS[pid].nome}</span>
            <span className="block text-xs" style={{ color: theme.muted }}>{PRODUTOS[pid].chamada}</span>
          </button>
        ))}
      </div>

    </section>
  );
}
