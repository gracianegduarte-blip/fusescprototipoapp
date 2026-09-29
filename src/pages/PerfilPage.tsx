import { useState, type ReactNode } from "react";
import { Card, Icon, PERFIL_LABEL, PERMISSOES_DEF, Toggle, can, type Conta, type Permissao, type PerfilRisco, type Theme, type ToastMsg, corConta } from "../shared";
import Sheet from "../components/Sheet";
import NivelSheet from "../components/NivelSheet";
import InformeSheet from "../components/InformeSheet";
import PerfilInvestSheet from "../components/PerfilInvestSheet";
import RecorrenciaSheet from "../components/RecorrenciaSheet";
import PortabilidadeSheet from "../components/PortabilidadeSheet";
import SegurancaSheet from "../components/SegurancaSheet";
import { NIVEIS, PLANO } from "../lib/regras";
import type { TamanhoFonte } from "../App";
import { PRODUTOS } from "../lib/produtos";

export type ThemePref = "system" | "light" | "dark";

function PermissoesSheet({ conta, theme, onClose, onSave, onVerComo }: {
  conta: Conta; theme: Theme; onClose: () => void; onSave: (perms: Permissao[]) => void; onVerComo: () => void;
}) {
  const [perms, setPerms] = useState<Permissao[]>(conta.permissoes);
  const cor = corConta(conta);
  const primeiroNome = conta.nome.split(" ")[0];
  const toggle = (id: Permissao) => setPerms((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 mb-2 pr-10">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold flex-shrink-0"
          style={{ background: cor }}>{conta.initials}</div>
        <div>
          <p className="font-bold" style={{ color: theme.text }}>O que {primeiroNome} vê no app</p>
          <p className="text-xs" style={{ color: theme.muted }}>{conta.nome} · {conta.parentesco}</p>
        </div>
      </div>
      <p className="text-xs mb-5 leading-relaxed" style={{ color: theme.muted }}>
        Quando {primeiroNome} entrar no app com o próprio acesso, só as áreas ligadas aqui vão aparecer.
        Você, como titular, continua vendo e gerenciando tudo.
      </p>
      <div className="space-y-2 mb-5">
        {PERMISSOES_DEF.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-2xl px-4 py-3.5"
            style={{ background: theme.inputBg, border: `1px solid ${theme.border}` }}>
            <div className="mr-3">
              <p className="text-sm font-medium" style={{ color: theme.text }}>{p.label}</p>
              <p className="text-xs mt-0.5" style={{ color: theme.muted }}>{p.desc}</p>
            </div>
            <Toggle on={perms.includes(p.id)} onToggle={() => toggle(p.id)} accent={theme.accent} off={theme.switchOff} label={p.label} />
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 min-h-12 py-3.5 rounded-2xl text-sm font-medium"
          style={{ background: theme.inputBg, color: theme.text }}>Cancelar</button>
        <button onClick={() => { onSave(perms); onClose(); }}
          className="flex-1 min-h-12 py-3.5 rounded-2xl text-white text-sm font-semibold"
          style={{ background: cor }}>Salvar</button>
      </div>
      <button onClick={() => { onSave(perms); onVerComo(); }}
        className="w-full min-h-11 mt-3 flex items-center justify-center gap-2 text-sm font-semibold"
        style={{ color: theme.accentText }}>
        <Icon.Eye size={16} /> Salvar e ver como {primeiroNome}
      </button>
    </div>
  );
}

type Servico = { id: string; label: string; desc: string; icon: ReactNode; perm: Permissao | null };

export default function PerfilPage({
  theme, themePref, setThemePref, contas, conta, hidden, nivel, onNivelChange, onUpdateConta, onSalvarPermissoes, onVerComo,
  showToast, onLogout, onAporteRecorrente, secao = "conta", onAbrirFamilia, fonte, onFonte,
}: {
  theme: Theme; themePref: ThemePref; setThemePref: (v: ThemePref) => void;
  contas: Conta[]; conta: Conta; hidden: boolean; nivel: 1 | 2; onNivelChange: (n: 1 | 2) => void;
  onUpdateConta: (c: Conta) => void; onSalvarPermissoes: (id: number, perms: Permissao[]) => void; onVerComo: (id: number) => void;
  showToast: (text: string, type?: ToastMsg["type"]) => void;
  onLogout: () => void; onAporteRecorrente: () => void;
  // "conta": dados, cadastro, serviços e preferências. "familia": contas dos familiares e o que cada um vê.
  secao?: "conta" | "familia"; onAbrirFamilia: () => void;
  fonte: TamanhoFonte; onFonte: (f: TamanhoFonte) => void;
}) {
  const [editando, setEditando] = useState<Conta | null>(null);
  const [sheet, setSheet] = useState<null | "nivel" | "informe" | "perfil" | "recorrencia" | "portabilidade" | "seguranca">(null);
  const titular = contas[0];
  const familia = contas.filter((c) => c.pessoa !== 0);
  const meusPlanos = contas.filter((c) => c.pessoa === 0);
  const nomeConta = conta.nome.split(" ")[0];

  const servicos: Servico[] = [
    { id: "informe", label: "Informe de rendimentos", desc: "Para a declaração do Imposto de Renda", icon: <Icon.Doc />, perm: "saldo" },
    { id: "perfil", label: "Perfil de investimento", desc: `Atual: ${PERFIL_LABEL[conta.perfil]} · altera a alocação`, icon: <Icon.Pie />, perm: "investimentos" },
    { id: "recorrencia", label: "Aporte recorrente", desc: conta.recorrenteAtiva ? `Ativo · todo dia ${conta.recorrenteDia}` : "Nenhum ativo", icon: <Icon.Repeat />, perm: "aportes" },
    { id: "portabilidade", label: "Portabilidade", desc: "Traga seu plano de outra instituição", icon: <Icon.Wallet size={20} />, perm: "aportes" },
    { id: "seguranca", label: "Segurança", desc: "Biometria e senha de acesso", icon: <Icon.Key />, perm: null },
  ];

  const opcoesTema: { id: ThemePref; label: string; icon: ReactNode }[] = [
    { id: "system", label: "Sistema", icon: <Icon.Monitor /> },
    { id: "light", label: "Claro", icon: <Icon.Sun /> },
    { id: "dark", label: "Escuro", icon: <Icon.Moon /> },
  ];

  return (
    <div className="space-y-4">
      {secao === "conta" && (<>
      {/* titular */}
      <Card className="!p-0 overflow-hidden" theme={theme}>
        <div className="p-5" style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentMid})` }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold"
              style={{ background: "rgba(255,255,255,0.2)" }}>{titular.initials}</div>
            <div className="text-white">
              <p className="font-bold">{titular.nome}</p>
              <p className="text-xs text-white/85">Titular · {PLANO.nome} · Desde {titular.anoAbertura}</p>
            </div>
          </div>
        </div>
        <div className="p-5">
          {[
            ["CPF", "•••.•••.999-45"],
            ["E-mail", "graciane@email.com"],
            ["Telefone", "(11) 9 ••••-4521"],
            ["Plano", PLANO.nome],
            ["Meus planos", meusPlanos.map((c) => PRODUTOS[c.produto].nome).join(" e ")],
            ["Modalidade", PLANO.modalidade],
            ["Perfil de risco", PERFIL_LABEL[titular.perfil]],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-3 border-b last:border-0" style={{ borderColor: theme.rowBorder }}>
              <span className="text-sm flex-shrink-0" style={{ color: theme.muted }}>{k}</span>
              <span className="text-sm font-semibold text-right" style={{ color: theme.text }}>{v}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* nível de conta */}
      <Card theme={theme}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-white text-sm flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentMid})` }}>
              N{nivel}
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: theme.text }}>Evolução do Nível de Conta</p>
              <p className="text-xs" style={{ color: theme.muted }}>
                Conta no Nível {nivel} · {nivel < 2 ? "1 etapa pendente" : "todas as etapas concluídas"}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: nivel < 2 ? theme.warningBg : theme.positiveBg, color: nivel < 2 ? theme.warning : theme.positive }}>
            {nivel < 2 ? "Pendente" : "Completo"}
          </span>
        </div>
        <div className="flex items-center gap-1 mb-4" aria-hidden="true">
          {[1, 2].map((i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full" style={{ background: nivel >= i ? theme.accent : theme.border }} />
          ))}
        </div>
        <div className="space-y-2.5 mb-4">
          {[
            { n: NIVEIS[1].titulo, desc: NIVEIS[1].desc, done: nivel >= 1 },
            { n: NIVEIS[2].titulo, desc: NIVEIS[2].desc, done: nivel >= 2 },
          ].map((lv) => (
            <div key={lv.n} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{ background: lv.done ? theme.tagBg : theme.inputBg, border: `1px solid ${lv.done ? theme.accent + "33" : theme.border}` }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white"
                style={{ background: lv.done ? theme.accent : theme.muted }}>
                {lv.done ? <Icon.Check size={11} sw={3} /> : <Icon.Plus size={11} sw={2.5} />}
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold" style={{ color: lv.done ? theme.accentText : theme.text }}>{lv.n}</p>
                <p className="text-xs" style={{ color: theme.muted }}>{lv.desc}</p>
              </div>
              {!lv.done && <span className="text-xs font-medium" style={{ color: theme.warning }}>Pendente</span>}
            </div>
          ))}
        </div>
        <p className="text-xs mb-4 leading-relaxed" style={{ color: theme.muted }}>
          Complete seus dados cadastrais para desbloquear limites maiores de movimentação.
        </p>
        <button onClick={() => setSheet("nivel")}
          className="w-full min-h-12 py-3 rounded-2xl font-bold text-sm text-white transition-all active:scale-95 flex items-center justify-center gap-2"
          style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentMid})` }}>
          <Icon.Star size={15} sw={2.5} />
          {nivel < 2 ? "Subir para Nível 2" : "Ver meus níveis"}
        </button>
      </Card>

      {/* serviços da conta ativa */}
      <Card theme={theme}>
        <p className="text-sm font-bold" style={{ color: theme.text }}>Serviços</p>
        <p className="text-xs mt-0.5 mb-3" style={{ color: theme.muted }}>
          {conta.pessoa === 0 ? `Do seu plano ${PRODUTOS[conta.produto].nome}` : `Da conta de ${nomeConta} (${conta.parentesco})`}
        </p>
        <div>
          {servicos.map((s) => {
            const bloqueado = s.perm !== null && !can(conta, s.perm);
            return (
              <button key={s.id}
                onClick={bloqueado ? () => showToast(`Você não tem permissão para isso na conta de ${nomeConta}.`, "error") : () => setSheet(s.id as NonNullable<typeof sheet>)}
                aria-disabled={bloqueado}
                className="w-full min-h-14 flex items-center gap-3 py-3 border-b last:border-0 text-left"
                style={{ borderColor: theme.rowBorder, opacity: bloqueado ? 0.7 : 1 }}>
                <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: theme.tagBg, color: theme.accentText }}>{s.icon}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold" style={{ color: theme.text }}>{s.label}</span>
                  <span className="block text-xs" style={{ color: theme.muted }}>{s.desc}</span>
                </span>
                <span style={{ color: theme.muted }}>{bloqueado ? <Icon.Lock size={16} /> : <Icon.ChevronRight />}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* atalho para a tela da família */}
      <button onClick={onAbrirFamilia}
        className="w-full min-h-16 flex items-center gap-3 rounded-2xl p-4 text-left"
        style={{ background: theme.surface, border: `1px solid ${theme.border}`, boxShadow: theme.shadow }}>
        <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: theme.tagBg, color: theme.accentText }}>
          <Icon.Shield />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-semibold" style={{ color: theme.text }}>Família e acessos</span>
          <span className="block text-xs" style={{ color: theme.muted }}>{familia.length} pessoas · defina o que cada uma vê</span>
        </span>
        <span style={{ color: theme.muted }}><Icon.ChevronRight /></span>
      </button>
      </>)}

      {/* contas familiares */}
      {secao === "familia" && (
      <Card theme={theme}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-bold" style={{ color: theme.text }}>Pessoas da família</p>
            <p className="text-xs mt-0.5" style={{ color: theme.muted }}>Defina o que cada pessoa vê quando entra no próprio perfil</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: theme.tagBg, color: theme.accentText }}>
            {familia.length} vinculada{familia.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="space-y-3">
          {familia.map((c) => {
            const cor = corConta(c);
            return (
              <div key={c.id} className="rounded-2xl p-4" style={{ background: theme.inputBg, border: `1px solid ${theme.border}` }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ background: cor }}>{c.initials}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: theme.text }}>{c.nome}</p>
                    <p className="text-xs" style={{ color: theme.muted }}>{c.parentesco} · {PRODUTOS[c.produto].nome}</p>
                  </div>
                  <button onClick={() => setEditando(c)} aria-label={`Definir o que ${c.nome} vê no app`}
                    className="min-h-11 flex items-center gap-1.5 px-3.5 rounded-xl text-xs font-semibold"
                    style={{ background: theme.tagBg, color: theme.accentText }}>
                    <Icon.Edit size={13} />
                    Acessos
                  </button>
                </div>
                <p className="text-xs mb-2" style={{ color: theme.muted }}>{c.nome.split(" ")[0]} vê:</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {c.permissoes.length === 0
                    ? <span className="text-xs px-2 py-1 rounded-lg" style={{ background: theme.inputBg, color: theme.muted, border: `1px solid ${theme.border}` }}>Nenhuma área liberada</span>
                    : c.permissoes.map((pid) => (
                      <span key={pid} className="text-xs px-2.5 py-1 rounded-lg font-medium"
                        style={{ background: theme.tagBg, color: theme.accentText }}>
                        {PERMISSOES_DEF.find((p) => p.id === pid)?.label}
                      </span>
                    ))}
                </div>
                <button onClick={() => onVerComo(c.id)}
                  className="w-full min-h-11 flex items-center justify-center gap-2 rounded-xl text-xs font-semibold"
                  style={{ background: theme.surface, color: theme.text, border: `1px solid ${theme.border}` }}>
                  <Icon.Eye size={15} /> Ver o app como {c.nome.split(" ")[0]}
                </button>
              </div>
            );
          })}
        </div>
      </Card>
      )}

      {/* aparência */}
      {secao === "conta" && (<>
      <Card theme={theme}>
        <p className="text-sm font-semibold" style={{ color: theme.text }} id="tema-label">Aparência</p>
        <p className="text-xs mt-0.5 mb-3" style={{ color: theme.muted }}>“Sistema” segue o tema do seu aparelho.</p>
        <div role="radiogroup" aria-labelledby="tema-label" className="grid grid-cols-3 gap-2 p-1 rounded-2xl" style={{ background: theme.inputBg }}>
          {opcoesTema.map((o) => {
            const on = themePref === o.id;
            return (
              <button key={o.id} role="radio" aria-checked={on} onClick={() => setThemePref(o.id)}
                className="min-h-11 flex items-center justify-center gap-1.5 rounded-xl text-xs font-semibold transition-all"
                style={on ? { background: theme.accent, color: "#fff" } : { background: "transparent", color: theme.muted }}>
                {o.icon}{o.label}
              </button>
            );
          })}
        </div>

        <p className="text-sm font-semibold mt-5" style={{ color: theme.text }} id="fonte-label">Tamanho do texto</p>
        <p className="text-xs mt-0.5 mb-3" style={{ color: theme.muted }}>Aumenta todos os textos do app.</p>
        <div role="radiogroup" aria-labelledby="fonte-label" className="grid grid-cols-3 gap-2 p-1 rounded-2xl" style={{ background: theme.inputBg }}>
          {(["normal", "grande", "maior"] as TamanhoFonte[]).map((f, i) => {
            const on = fonte === f;
            return (
              <button key={f} role="radio" aria-checked={on} onClick={() => onFonte(f)}
                className="min-h-11 flex items-center justify-center gap-1.5 rounded-xl font-semibold transition-all"
                style={on ? { background: theme.accent, color: "#fff" } : { background: "transparent", color: theme.muted }}>
                <span style={{ fontSize: 12 + i * 3 }}>Aa</span>
                <span className="text-xs">{f === "normal" ? "Normal" : f === "grande" ? "Grande" : "Maior"}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <button onClick={onLogout} className="w-full min-h-12 py-3.5 rounded-2xl text-sm font-medium flex items-center justify-center gap-2"
        style={{ background: theme.surface, color: theme.danger, border: `1px solid ${theme.dangerBorder}` }}>
        <Icon.Logout /> Sair da conta
      </button>
      </>)}

      {sheet === "nivel" && (
        <Sheet theme={theme} label="Nível de conta" onClose={() => setSheet(null)}>
          <NivelSheet theme={theme} nivel={nivel} onNivelChange={onNivelChange} onClose={() => setSheet(null)} showToast={showToast} />
        </Sheet>
      )}
      {sheet === "informe" && (
        <Sheet theme={theme} label="Informe de rendimentos" onClose={() => setSheet(null)}>
          <InformeSheet theme={theme} conta={conta} hidden={hidden} onClose={() => setSheet(null)} showToast={showToast} />
        </Sheet>
      )}
      {sheet === "perfil" && (
        <Sheet theme={theme} label="Perfil de investimento" onClose={() => setSheet(null)}>
          <PerfilInvestSheet theme={theme} conta={conta} hidden={hidden} onClose={() => setSheet(null)}
            onSave={(perfil: PerfilRisco) => {
              onUpdateConta({ ...conta, perfil });
              setSheet(null);
              showToast(`Perfil ${PERFIL_LABEL[perfil]} salvo. A carteira será ajustada.`);
            }} />
        </Sheet>
      )}
      {sheet === "recorrencia" && (
        <Sheet theme={theme} label="Aporte recorrente" onClose={() => setSheet(null)}>
          <RecorrenciaSheet theme={theme} conta={conta} hidden={hidden} onClose={() => setSheet(null)}
            onCancelar={() => {
              onUpdateConta({ ...conta, recorrenteAtiva: false });
              setSheet(null);
              showToast("Aporte recorrente cancelado");
            }}
            onAlterar={() => { setSheet(null); onAporteRecorrente(); }} />
        </Sheet>
      )}
      {sheet === "portabilidade" && (
        <Sheet theme={theme} label="Portabilidade" onClose={() => setSheet(null)}>
          <PortabilidadeSheet theme={theme} conta={conta} onClose={() => setSheet(null)} />
        </Sheet>
      )}
      {sheet === "seguranca" && (
        <Sheet theme={theme} label="Segurança" onClose={() => setSheet(null)}>
          <SegurancaSheet theme={theme} onClose={() => setSheet(null)} showToast={showToast} />
        </Sheet>
      )}
      {editando && (
        <Sheet theme={theme} label="Permissões de acesso" onClose={() => setEditando(null)}>
          <PermissoesSheet conta={editando} theme={theme} onClose={() => setEditando(null)}
            onSave={(perms) => { onSalvarPermissoes(editando.id, perms); showToast(`Acessos de ${editando.nome.split(" ")[0]} atualizados`); }}
            onVerComo={() => { const id = editando.id; setEditando(null); onVerComo(id); }} />
        </Sheet>
      )}
    </div>
  );
}
