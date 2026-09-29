import { useState } from "react";
import { Icon, type Theme } from "../shared";
import { usePersisted } from "../lib/storage";
import { TRILHAS, type Categoria, type Licao, type Trilha } from "../lib/explorar";

const CATEGORIAS: ("Todas" | Categoria)[] = ["Todas", "Finanças", "Previdência", "Proteção"];

const CAPA: Record<Categoria, { cor: string; icon: React.ReactNode }> = {
  Finanças: { cor: "#2A5C40", icon: <Icon.Wallet size={28} /> },
  Previdência: { cor: "#1A6A8A", icon: <Icon.Shield size={28} /> },
  Proteção: { cor: "#8A4A6A", icon: <Icon.User size={28} /> },
};

export default function TrilhasSheet({ theme, onSignup }: { theme: Theme; onSignup: () => void }) {
  const [filtro, setFiltro] = useState<(typeof CATEGORIAS)[number]>("Todas");
  const [trilhaId, setTrilhaId] = useState<number | null>(null);
  const [licaoId, setLicaoId] = useState<number | null>(null);
  const [bloqueio, setBloqueio] = useState(false);
  const [concluidas, setConcluidas] = usePersisted<number[]>("fusesc:licoes-concluidas", []);

  const trilha = TRILHAS.find((t) => t.id === trilhaId) ?? null;
  const licao = trilha?.licoes.find((l) => l.id === licaoId) ?? null;
  const progresso = (t: Trilha) => t.licoes.filter((l) => concluidas.includes(l.id)).length;
  const alternar = (id: number) =>
    setConcluidas((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  const abrirLicao = (l: Licao) => (l.bloqueada ? setBloqueio(true) : setLicaoId(l.id));

  if (bloqueio) {
    return (
      <div className="text-center pt-2">
        <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ background: theme.accentTag, color: theme.accentText }}>
          <Icon.Lock size={28} />
        </div>
        <p className="text-lg font-bold mb-2" style={{ color: theme.text }}>Gostou do conteúdo?</p>
        <p className="text-sm leading-relaxed mb-6" style={{ color: theme.muted }}>
          Faça seu pré-cadastro em 30 segundos para salvar o progresso e desbloquear esta e outras aulas exclusivas.
        </p>
        <button onClick={onSignup} className="w-full min-h-12 py-3.5 rounded-2xl text-sm font-bold text-white mb-2" style={{ background: theme.accent }}>
          Fazer pré-cadastro grátis
        </button>
        <button onClick={() => setBloqueio(false)} className="w-full min-h-11 text-sm font-medium" style={{ color: theme.muted }}>
          Continuar explorando
        </button>
      </div>
    );
  }

  if (trilha && licao) {
    const feita = concluidas.includes(licao.id);
    return (
      <div>
        <button onClick={() => setLicaoId(null)} className="min-h-11 flex items-center gap-1 text-sm font-semibold mb-2" style={{ color: theme.accentText }}>
          <Icon.ChevronLeft /> {trilha.titulo}
        </button>
        <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: theme.accentText }}>
          Aula {trilha.licoes.indexOf(licao) + 1} · {licao.duracao}
        </p>
        <h3 className="text-xl font-bold leading-tight mb-4" style={{ color: theme.text }}>{licao.titulo}</h3>
        <div className="space-y-3 mb-6">
          {licao.conteudo.map((p, i) => (
            <p key={i} className="text-sm leading-relaxed" style={{ color: theme.text }}>{p}</p>
          ))}
        </div>
        <button onClick={() => alternar(licao.id)} aria-pressed={feita}
          className="w-full min-h-12 py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
          style={feita ? { background: theme.inputBg, color: theme.text } : { background: theme.accent, color: "#fff" }}>
          <Icon.Check /> {feita ? "Aula concluída" : "Marcar como concluída"}
        </button>
      </div>
    );
  }

  if (trilha) {
    const feitas = progresso(trilha);
    return (
      <div>
        <button onClick={() => setTrilhaId(null)} className="min-h-11 flex items-center gap-1 text-sm font-semibold mb-2" style={{ color: theme.accentText }}>
          <Icon.ChevronLeft /> Todas as trilhas
        </button>
        <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: CAPA[trilha.categoria].cor }}>{trilha.categoria}</p>
        <h3 className="text-xl font-bold leading-tight mb-1" style={{ color: theme.text }}>{trilha.titulo}</h3>
        <p className="text-sm mb-4" style={{ color: theme.muted }}>{trilha.descricao}</p>
        <Barra theme={theme} pct={(feitas / trilha.licoes.length) * 100} />
        <p className="text-xs mt-1.5 mb-4" style={{ color: theme.muted }}>{feitas} de {trilha.licoes.length} aulas concluídas</p>
        <ul className="space-y-2">
          {trilha.licoes.map((l, i) => {
            const feita = concluidas.includes(l.id);
            return (
              <li key={l.id}>
                <button onClick={() => abrirLicao(l)}
                  className="w-full min-h-14 flex items-center gap-3 rounded-2xl px-4 py-3 text-left"
                  style={{ background: theme.inputBg, border: `1px solid ${theme.border}` }}>
                  <span className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={feita ? { background: theme.accent, color: "#fff" } : { background: theme.surface, color: theme.accentText }}>
                    {feita ? <Icon.Check /> : i + 1}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold" style={{ color: theme.text }}>{l.titulo}</span>
                    <span className="block text-xs" style={{ color: theme.muted }}>{l.bloqueada ? "Exclusiva para cadastrados" : l.duracao}</span>
                  </span>
                  <span style={{ color: theme.muted }}>{l.bloqueada ? <Icon.Lock size={16} /> : <Icon.ChevronRight />}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  const lista = filtro === "Todas" ? TRILHAS : TRILHAS.filter((t) => t.categoria === filtro);
  return (
    <div>
      <p className="text-lg font-bold pr-10" style={{ color: theme.text }}>Jornadas de conhecimento</p>
      <p className="text-sm mb-4" style={{ color: theme.muted }}>Lições curtas e gratuitas para dominar suas finanças.</p>
      <div className="flex gap-2 overflow-x-auto -mx-6 px-6 pb-1 mb-4" role="group" aria-label="Filtrar por categoria">
        {CATEGORIAS.map((c) => (
          <button key={c} onClick={() => setFiltro(c)} aria-pressed={filtro === c}
            className="min-h-9 px-4 rounded-full text-xs font-semibold whitespace-nowrap"
            style={filtro === c ? { background: theme.accent, color: "#fff" } : { background: theme.inputBg, color: theme.muted }}>
            {c}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {lista.map((t) => {
          const feitas = progresso(t);
          const capa = CAPA[t.categoria];
          return (
            <button key={t.id} onClick={() => setTrilhaId(t.id)} className="w-full rounded-2xl overflow-hidden text-left"
              style={{ border: `1px solid ${theme.border}`, background: theme.surface }}>
              <div className="h-20 relative flex items-center px-4 text-white"
                style={{ background: `linear-gradient(135deg, ${capa.cor}, ${capa.cor}B0)` }}>
                <span className="opacity-90">{capa.icon}</span>
                <span className="absolute top-3 right-3 text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }}>
                  {t.categoria}
                </span>
              </div>
              <div className="p-4">
                <p className="text-sm font-bold" style={{ color: theme.text }}>{t.titulo}</p>
                <p className="text-xs mt-1 mb-3 leading-relaxed" style={{ color: theme.muted }}>{t.descricao}</p>
                <Barra theme={theme} pct={(feitas / t.licoes.length) * 100} />
                <div className="flex justify-between text-xs mt-1.5">
                  <span style={{ color: theme.muted }}>{feitas}/{t.licoes.length} aulas</span>
                  <span className="font-semibold flex items-center gap-0.5" style={{ color: theme.accentText }}>Ver trilha <Icon.ChevronRight size={14} /></span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <button onClick={onSignup} className="w-full min-h-12 py-3.5 rounded-2xl text-sm font-bold text-white mt-5" style={{ background: theme.accent }}>
        Quero aplicar isso: pré-cadastro grátis
      </button>
    </div>
  );
}

function Barra({ theme, pct }: { theme: Theme; pct: number }) {
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: theme.border }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: theme.accentMid }} />
    </div>
  );
}
