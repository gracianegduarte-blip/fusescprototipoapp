import { useEffect, useRef, useState, type ReactNode } from "react";
import { CONTAS_INICIAL, DESTAQUE, corConta, corContaAccent, corContaMid, Icon, NOTIFICACOES_INICIAL, T, ToastContainer, PERFIL_LABEL, PERMISSOES_DEF, can, haptic, type Conta, type Notificacao, type Permissao, type ProdutoId, type Theme, type ToastMsg } from "./shared";
import { hhmm } from "./lib/format";
import { usePersisted } from "./lib/storage";
import Sheet from "./components/Sheet";
import ContaSwitcher from "./components/ContaSwitcher";
import NotificacoesSheet from "./components/NotificacoesSheet";
import LockedState from "./components/LockedState";
import LoginPage from "./pages/LoginPage";
import ExplorarPage from "./pages/ExplorarPage";
import PreCadastroPage from "./pages/PreCadastroPage";
import type { MetaRascunho } from "./lib/explorar";
import InicioPage from "./pages/InicioPage";
import AportesPage from "./pages/AportesPage";
import InvestimentosPage from "./pages/InvestimentosPage";
import SimuladorPage from "./pages/SimuladorPage";
import PerfilPage, { type ThemePref } from "./pages/PerfilPage";
import Chat from "./pages/Chat";
import MenuPanel, { type MenuGrupo } from "./components/MenuPanel";
import MeusPlanos from "./components/MeusPlanos";
import { PRODUTOS } from "./lib/produtos";
import ExtratoSheet from "./components/ExtratoSheet";
import InformeSheet from "./components/InformeSheet";
import ResgateSheet from "./components/ResgateSheet";
import RecorrenciaSheet from "./components/RecorrenciaSheet";
import PerfilInvestSheet from "./components/PerfilInvestSheet";
import PortabilidadeSheet from "./components/PortabilidadeSheet";
import NivelSheet from "./components/NivelSheet";
import SegurancaSheet from "./components/SegurancaSheet";
import { FUSESC, PLANO } from "./lib/regras";

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
type Tab = "inicio" | "aportes" | "investimentos" | "simulador" | "perfil" | "familia";
// Abas da barra de baixo. As demais telas abrem pelo menu e ganham botão Voltar.
const ABAS_NAV: Tab[] = ["inicio", "aportes", "simulador", "perfil"];

export type TamanhoFonte = "normal" | "grande" | "maior";
const FONTE_PX: Record<TamanhoFonte, string> = { normal: "16px", grande: "18px", maior: "20px" };
const FONTE_LABEL: Record<TamanhoFonte, string> = { normal: "Normal", grande: "Grande", maior: "Maior" };
const PROXIMA_FONTE: Record<TamanhoFonte, TamanhoFonte> = { normal: "grande", grande: "maior", maior: "normal" };

const PERMISSAO_DA_ABA: Record<Tab, Permissao | null> = {
  inicio: "saldo", aportes: "aportes", investimentos: "investimentos", simulador: "simulador", perfil: null, familia: null,
};

const TODAS_PERMISSOES = PERMISSOES_DEF.map((p) => p.id);

const TEXTO_BLOQUEIO: Record<Tab, string> = {
  inicio: "o saldo e a movimentação",
  aportes: "os aportes",
  investimentos: "os investimentos",
  simulador: "o simulador",
  perfil: "",
  familia: "",
};

export default function App() {
  const [logado, setLogado] = useState(false);
  const [entrada, setEntrada] = useState<"explorar" | "login" | "cadastro">("explorar");
  const [metaRascunho, setMetaRascunho] = useState<MetaRascunho | undefined>(undefined);
  const [tab, setTab] = useState<Tab>("inicio");
  const [abaAnterior, setAbaAnterior] = useState<Tab>("inicio");
  const [fonte, setFonte] = usePersisted<TamanhoFonte>("fusesc:fonte", "normal");
  const [aporteInicial, setAporteInicial] = useState<number | undefined>(undefined);
  const [aporteInicialTipo, setAporteInicialTipo] = useState<"extra" | "recorrente">("extra");
  const [aporteKey, setAporteKey] = useState(0);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatHuman, setChatHuman] = useState(false);
  const [themePref, setThemePref] = usePersisted<ThemePref>("fusesc:tema", "system");
  const [systemDark, setSystemDark] = useState(() => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false);
  const [hidden, setHidden] = usePersisted("fusesc:ocultar-saldos", false);
  const [contaAtivaId, setContaAtivaId] = useState(0);
  const [contas, setContas] = useState<Conta[]>(CONTAS_INICIAL);
  // Pré-visualização: o titular vê o app como o dependente da conta ativa verá (só com as áreas liberadas).
  const [verComo, setVerComo] = useState(false);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>(NOTIFICACOES_INICIAL);
  const [showNotif, setShowNotif] = useState(false);
  const [conhecer, setConhecer] = useState<ProdutoId | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuSheet, setMenuSheet] = useState<null | "extrato" | "informe" | "resgate" | "recorrencia" | "perfilInvest" | "portabilidade" | "nivel" | "seguranca">(null);
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(() => new Date());
  const [online, setOnline] = useState(() => navigator.onLine);
  const [nivel, setNivel] = useState<1 | 2>(1);
  const mainRef = useRef<HTMLElement>(null);
  const touchStartYRef = useRef(0);
  const pullActiveRef = useRef(false);
  const toastId = useRef(0);

  const showToast = (text: string, type: ToastMsg["type"] = "success") => {
    const id = ++toastId.current;
    setToasts((ts) => [...ts, { id, text, type }]);
    window.setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 3200);
  };

  const contaReal = contas.find((c) => c.id === contaAtivaId)!;
  // O titular vê e gerencia tudo; as permissões só valem na pré-visualização do dependente.
  const conta: Conta = verComo ? contaReal : { ...contaReal, permissoes: TODAS_PERMISSOES };
  const isTitular = contaReal.pessoa === 0;
  const nomeCurto = conta.nome.split(" ")[0];
  const cor = corConta(conta);
  const dark = themePref === "dark" || (themePref === "system" && systemDark);
  const base = dark ? T.dark : T.light;
  const theme: Theme = {
    ...base,
    accent: cor,
    accentMid: corContaMid(conta),
    accentText: dark ? corContaAccent(conta) : cor,
    accentTag: cor + (dark ? "30" : "18"),
    accentPale: cor + (dark ? "18" : "0D"),
    tagBg: cor + (dark ? "30" : "18"),
    tagText: dark ? corContaAccent(conta) : cor,
    bellBg: cor + (dark ? "30" : "18"),
    shadow: `0 1px 8px ${cor}0D`,
    navShadow: `0 -4px 24px ${cor}18`,
  };

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const goOnline = () => { setOnline(true); showToast("Conexão restabelecida", "info"); };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => { window.removeEventListener("online", goOnline); window.removeEventListener("offline", goOffline); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    document.body.style.background = theme.bg;
    root.style.colorScheme = dark ? "dark" : "light";
    root.style.setProperty("--range-track", theme.border);
    root.style.setProperty("--range-thumb", cor);
    root.style.setProperty("--range-thumb-border", theme.surface);
    root.lang = "pt-BR";
  }, [dark, theme.bg, theme.border, theme.surface, cor]);

  // Tamanho do texto: o app usa rem, então basta mudar a fonte da raiz.
  useEffect(() => { document.documentElement.style.fontSize = FONTE_PX[fonte]; }, [fonte]);

  // Cor da barra de status da moldura do celular: verde-escuro nas telas de entrada, cabeçalho do tema no app.
  const telaEscura = !logado;
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--sb-bg", telaEscura ? "#0D2118" : theme.headerBg);
    root.style.setProperty("--sb-fg", telaEscura ? "#FFFFFF" : theme.text);
  }, [telaEscura, theme.headerBg, theme.text]);

  useEffect(() => { mainRef.current?.scrollTo({ top: 0 }); }, [tab, contaAtivaId]);

  // As páginas recebem a conta com acesso total; as permissões guardadas só mudam por salvarPermissoes.
  const updateConta = (updated: Conta) =>
    setContas((cs) => cs.map((c) => (c.id === updated.id ? { ...updated, permissoes: c.permissoes } : c)));

  const salvarPermissoes = (id: number, permissoes: Permissao[]) =>
    setContas((cs) => cs.map((c) => (c.id === id ? { ...c, permissoes } : c)));

  const carregar = (comToast: boolean) => {
    if (loading) return;
    setLoading(true);
    window.setTimeout(() => {
      const agora = new Date();
      setLoading(false);
      setUpdatedAt(agora);
      if (comToast) showToast(`Dados atualizados às ${hhmm(agora)}`);
    }, comToast ? 1000 : 500);
  };

  const trocarConta = (id: number) => {
    setVerComo(false);
    setContaAtivaId(id);
    setTab("inicio");
  };

  // Telas fora da barra de baixo lembram de onde vieram, para o botão Voltar.
  const abrirTela = (t: Tab) => {
    if (ABAS_NAV.includes(tab)) setAbaAnterior(tab);
    setTab(t);
  };

  const voltarParaMinha = () => trocarConta(0);

  const verAppComo = (id: number) => {
    trocarConta(id);
    setVerComo(true);
  };

  const sairDaPrevia = () => {
    trocarConta(0);
    setTab("perfil");
  };

  const irParaAporte = (v?: number, t?: "extra" | "recorrente") => {
    if (v !== undefined || t !== undefined) {
      setAporteInicial(v);
      setAporteInicialTipo(t ?? "extra");
      setAporteKey((k) => k + 1);
    }
    setTab("aportes");
  };

  const abrirChat = (humano: boolean) => { setChatHuman(humano); setShowChat(true); };

  const sair = () => {
    haptic("medium");
    setShowLogoutConfirm(false);
    setLogado(false);
    setEntrada("login");
    setVerComo(false);
    setContaAtivaId(0);
    setTab("inicio");
    setShowChat(false);
    setAporteKey((k) => k + 1);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLElement>) => {
    touchStartYRef.current = e.touches[0].clientY;
    pullActiveRef.current = false;
  };
  const handleTouchMove = (e: React.TouchEvent<HTMLElement>) => {
    if (!mainRef.current) return;
    const delta = e.touches[0].clientY - touchStartYRef.current;
    if (mainRef.current.scrollTop === 0 && delta > 60) pullActiveRef.current = true;
  };
  const handleTouchEnd = () => {
    if (pullActiveRef.current) carregar(true);
    pullActiveRef.current = false;
  };

  const unreadCount = notificacoes.filter((n) => !n.lida).length;
  const bloqueada = (t: Tab) => {
    const p = PERMISSAO_DA_ABA[t];
    return p !== null && !can(conta, p);
  };

  const navItems: { id: Tab; icon: ReactNode; label: string }[] = [
    { id: "inicio",    icon: <Icon.Home size={26} />,         label: "Início"    },
    { id: "aportes",   icon: <Icon.Plus size={26} sw={2.4} />, label: "Aportar"   },
    { id: "simulador", icon: <Icon.Sim size={26} />,          label: "Simulador" },
    { id: "perfil",    icon: <Icon.User size={26} />,         label: "Conta"     },
  ];

  const titulos: Record<Tab, string> = {
    inicio: "", aportes: "Aportar", investimentos: "Investimentos", simulador: "Simulador", perfil: "Minha conta",
    familia: "Família e acessos",
  };
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
  // Na pré-visualização a conta ativa é "a própria conta" de quem está entrando.
  const contaPropria = isTitular || verComo;
  const tituloTela = tab === "inicio"
    ? (contaPropria ? `${saudacao}, ${nomeCurto}` : `Conta de ${nomeCurto}`)
    : titulos[tab];

  if (!logado) {
    if (entrada === "login") return <LoginPage onLogin={() => setLogado(true)} onVoltar={() => setEntrada("explorar")} />;
    if (entrada === "cadastro") {
      return (
        <PreCadastroPage meta={metaRascunho} onVoltar={() => setEntrada("explorar")}
          onConcluir={(d) => {
            setLogado(true);
            const idade = new Date().getFullYear() - Number(d.nascimento);
            if (idade >= 60 && fonte === "normal") {
              setFonte("grande");
              showToast("Deixamos o texto maior para facilitar a leitura. Ajuste em Menu › Preferências.", "info");
            } else {
              showToast(`Bem-vindo(a), ${d.nome.split(" ")[0]}! Você está vendo uma conta de demonstração.`, "info");
            }
          }} />
      );
    }
    return (
      <ExplorarPage theme={theme} dark={dark} onToggleTema={() => setThemePref(dark ? "light" : "dark")}
        onEntrar={() => setEntrada("login")}
        onCadastro={(meta) => { setMetaRascunho(meta); setEntrada("cadastro"); }}
        onDemo={() => { setLogado(true); showToast("Conta de demonstração: explore à vontade.", "info"); }} />
    );
  }

  const nomeTitular = contas[0].nome.split(" ")[0];
  const conteudoBloqueado = (t: Tab) => {
    const perm = PERMISSAO_DA_ABA[t]!;
    return (
      <LockedState theme={theme}
        titulo="Área não liberada"
        descricao={`${nomeTitular} ainda não liberou ${TEXTO_BLOQUEIO[t]} para ${nomeCurto}. É isso que ${nomeCurto} vê ao tocar aqui.`}
        labelSolicitar={`Liberar para ${nomeCurto}`}
        onSolicitar={() => {
          salvarPermissoes(conta.id, [...contaReal.permissoes, perm]);
          showToast(`${nomeCurto} agora vê ${TEXTO_BLOQUEIO[t]}.`);
        }}
        labelVoltar="Sair da pré-visualização"
        onVoltar={sairDaPrevia} />
    );
  };

  // ── menu completo (☰) ──────────────────────────────────────────────────────
  const fecharMenuE = (fn: () => void) => () => { setShowMenu(false); fn(); };
  const semAcesso = (p: Permissao | null) => p !== null && !can(conta, p);
  const item = (id: string, label: string, icon: ReactNode, perm: Permissao | null, acao: () => void, desc?: string) => ({
    id, label, icon, desc, bloqueado: semAcesso(perm),
    onClick: semAcesso(perm)
      ? () => showToast(`Esta área não foi liberada para ${nomeCurto}.`, "error")
      : fecharMenuE(acao),
  });
  const abrirSheet = (s: NonNullable<typeof menuSheet>) => () => setMenuSheet(s);
  const proximoTema: Record<ThemePref, ThemePref> = { system: "light", light: "dark", dark: "system" };
  const nomeTema: Record<ThemePref, string> = { system: "Sistema", light: "Claro", dark: "Escuro" };

  const gruposMenu: MenuGrupo[] = [
    {
      titulo: "Mais usados",
      itens: [
        item("extrato", "Extrato", <Icon.Doc />, "aportes", abrirSheet("extrato"), "Aportes e rendimentos por período"),
        item("investimentos", "Investimentos", <Icon.Chart />, "investimentos", () => abrirTela("investimentos"), "Como a FUSESC investe o seu dinheiro"),
        item("informe", "Informe de rendimentos", <Icon.Doc />, "saldo", abrirSheet("informe"), "Para a declaração do IR"),
      ],
    },
    {
      titulo: "Aportes e resgates",
      itens: [
        item("recorrencia", "Aporte recorrente", <Icon.Repeat />, "aportes", abrirSheet("recorrencia"),
          conta.recorrenteAtiva ? `Ativo · todo dia ${conta.recorrenteDia}` : "Nenhum ativo"),
        item("resgate", "Resgate", <Icon.Download size={20} />, "resgates", abrirSheet("resgate"), `Regras e pedido · carência de ${PLANO.carenciaMeses} meses`),
        item("portabilidade", "Portabilidade", <Icon.Wallet size={20} />, "aportes", abrirSheet("portabilidade"), "Traga um plano de outra instituição"),
      ],
    },
    {
      titulo: "Segurança e cadastro",
      itens: [
        item("perfilInvest", "Perfil de investimento", <Icon.Pie />, "investimentos", abrirSheet("perfilInvest"), `Atual: ${PERFIL_LABEL[conta.perfil]}`),
        item("nivel", "Nível de cadastro", <Icon.Star size={18} />, null, abrirSheet("nivel"), `Nível ${nivel} de 2`),
        item("seguranca", "Segurança", <Icon.Key />, null, abrirSheet("seguranca"), "Biometria e senha"),
      ],
    },
    ...(verComo ? [] : [{
      titulo: "Família",
      itens: [
        item("trocar", "Trocar de plano ou pessoa", <Icon.Repeat />, null, () => setShowSwitcher(true), `${new Set(contas.map((c) => c.pessoa)).size} pessoas na família`),
        item("acessos", "Família e acessos", <Icon.Shield />, null, () => abrirTela("familia"), "Defina o que cada pessoa vê"),
      ],
    }]),
    {
      titulo: "Ajuda",
      itens: [
        item("chat", "Assistente FUSESC", <Icon.Chat />, null, () => abrirChat(false), "Tire dúvidas a qualquer hora"),
        item("humano", "Falar com um atendente", <Icon.Headset />, null, () => abrirChat(true), "Segunda a sexta, das 8h às 18h"),
        item("central", "Central de Atendimento", <Icon.Bell />, null, () => { window.location.href = `tel:${FUSESC.telefone.replace(/\D/g, "")}`; },
          `${FUSESC.telefone} · ${FUSESC.email}`),
      ],
    },
    {
      titulo: "Preferências",
      itens: [
        { id: "fonte", label: "Tamanho do texto", icon: <span className="text-sm font-bold">Aa</span>,
          desc: `${FONTE_LABEL[fonte]} · toque para trocar`, onClick: () => setFonte(PROXIMA_FONTE[fonte]) },
        { id: "ocultar", label: hidden ? "Mostrar saldos" : "Ocultar saldos", icon: hidden ? <Icon.Eye /> : <Icon.EyeOff />,
          desc: hidden ? "Os valores estão ocultos" : "Esconde os valores na tela", onClick: () => setHidden(!hidden) },
        { id: "tema", label: "Aparência", icon: <Icon.Monitor />, desc: `Tema: ${nomeTema[themePref]} · toque para trocar`,
          onClick: () => setThemePref(proximoTema[themePref]) },
      ],
    },
  ];

  const podeAportar = can(conta, "aportes");

  return (
    <div className="size-full flex flex-col relative overflow-hidden"
      style={{ background: theme.bg, color: theme.text, transition: "background 0.3s, color 0.3s" }}>
      <ToastContainer toasts={toasts} />

      {loading && tab !== "inicio" && tab !== "investimentos" && (
        <div className="absolute z-30 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg pointer-events-none"
          role="status" style={{ top: "88px", left: "50%", transform: "translateX(-50%)", background: theme.surface, color: theme.accentText, border: `1px solid ${theme.border}`, boxShadow: theme.shadow }}>
          <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity="0.3" />
            <path d="M12 3a9 9 0 019 9" strokeLinecap="round" />
          </svg>
          <span className="text-xs font-semibold">Atualizando…</span>
        </div>
      )}

      {/* header */}
      <header className="px-5 pt-6 pb-3 flex-shrink-0" style={{ background: theme.headerBg }}>
        <div className="flex items-center justify-between gap-2 mb-1">
          <button onClick={() => { haptic("light"); setShowSwitcher(true); }}
            aria-haspopup="dialog" aria-label={`Trocar de plano ou pessoa. Atual: ${conta.nome}, ${isTitular ? PRODUTOS[conta.produto].nome : conta.parentesco}`}
            className="min-h-11 flex items-center gap-2.5 rounded-2xl px-3 py-1.5 transition-all active:scale-95 min-w-0"
            style={{ background: theme.surface, border: `1.5px solid ${theme.border}` }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: cor }}>
              {conta.initials}
            </div>
            <div className="text-left min-w-0">
              <p className="text-xs font-bold leading-tight truncate" style={{ color: theme.text }}>
                {conta.nome.split(" ")[0]} {conta.nome.split(" ")[1]}
              </p>
              <p className="text-xs leading-tight" style={{ color: theme.muted }}>{isTitular ? PRODUTOS[conta.produto].nome : conta.parentesco}</p>
            </div>
            <span style={{ color: theme.muted }}><Icon.Chevron /></span>
          </button>

          <div className="flex items-center gap-2">
            <button onClick={() => { haptic("light"); abrirChat(false); }} aria-haspopup="dialog" aria-label="Abrir chat de ajuda"
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ background: theme.bellBg, color: theme.text }}>
              <Icon.Chat />
            </button>
            <button onClick={() => setShowNotif(true)} className="w-11 h-11 rounded-full flex items-center justify-center relative"
              aria-label={unreadCount > 0 ? `Notificações, ${unreadCount} não lidas` : "Notificações"}
              style={{ background: theme.bellBg, color: theme.text }}>
              <Icon.Bell />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-xs font-bold text-white px-1"
                  style={{ background: "#8A5A00" }} aria-hidden="true">
                  {unreadCount}
                </span>
              )}
            </button>
            <button onClick={() => { haptic("light"); setShowMenu(true); }} aria-haspopup="dialog" aria-label="Abrir menu"
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ background: theme.bellBg, color: theme.text }}>
              <Icon.Menu />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-2">
          {!ABAS_NAV.includes(tab) && (
            <button onClick={() => setTab(abaAnterior)} aria-label="Voltar"
              className="w-11 h-11 -ml-2 rounded-full flex items-center justify-center flex-shrink-0" style={{ color: theme.text }}>
              <Icon.ChevronLeft size={22} />
            </button>
          )}
          <h1 className="text-xl font-bold px-1" style={{ color: theme.text }}>{tituloTela}</h1>
        </div>
      </header>

      {!isTitular && (
        <div className="flex-shrink-0 px-5 py-2 flex items-center justify-between gap-3 text-white" role="status" style={{ background: cor }}>
          <p className="text-xs leading-snug min-w-0 flex items-center gap-2">
            {verComo && <span className="flex-shrink-0"><Icon.Eye size={16} /></span>}
            <span>
              {verComo
                ? <>Pré-visualização: é assim que <strong>{nomeCurto}</strong> vê o app</>
                : <>Você está gerenciando a conta de <strong>{nomeCurto} ({conta.parentesco})</strong></>}
            </span>
          </p>
          <button onClick={verComo ? sairDaPrevia : voltarParaMinha} className="min-h-11 px-3.5 rounded-xl text-xs font-bold flex-shrink-0" style={{ background: "rgba(255,255,255,0.22)" }}>
            {verComo ? "Sair" : "Voltar à minha conta"}
          </button>
        </div>
      )}

      {!online && (
        <div className="flex-shrink-0 px-5 py-2 flex items-center gap-2 text-xs font-medium" role="status"
          style={{ background: theme.warningBg, color: theme.warning, borderBottom: `1px solid ${theme.warningBorder}` }}>
          <Icon.Wifi size={14} /> Você está offline. Alguns dados podem estar desatualizados.
        </div>
      )}

      {/* content */}
      <main ref={mainRef} className={`flex-1 overflow-y-auto px-4 pt-2 ${tab === "aportes" ? "pb-0" : "pb-20"}`}
        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        {tab !== "aportes" && (
          <div key={tab} className="tab-enter">
            {bloqueada(tab) ? conteudoBloqueado(tab) : (
              <>
                {tab === "inicio" && isTitular && !verComo && (
                  <div className="mb-4">
                    <MeusPlanos theme={theme} contas={contas} contaAtiva={contaAtivaId} hidden={hidden}
                      onSelect={trocarConta} onConhecer={setConhecer} />
                  </div>
                )}
                {tab === "inicio" && (
                  <InicioPage conta={conta} theme={theme} hidden={hidden} isTitular={contaPropria} loading={loading}
                    updatedAt={updatedAt} onRefresh={() => carregar(true)} onAporte={irParaAporte} onToggleHidden={() => setHidden(!hidden)}
                    onGoToSimulador={() => setTab("simulador")} onUpdateConta={updateConta} showToast={showToast} />
                )}
                {tab === "investimentos" && (
                  <InvestimentosPage theme={theme} hidden={hidden} conta={conta} loading={loading}
                    onUpdateConta={updateConta} onFalarAssessor={() => abrirChat(true)} showToast={showToast} />
                )}
                {tab === "simulador" && (
                  <SimuladorPage theme={theme} conta={conta} hidden={hidden} onUpdateConta={updateConta} showToast={showToast} />
                )}
                {tab === "perfil" && verComo && (
                  <div className="rounded-2xl border p-5 text-center" style={{ background: theme.surface, borderColor: theme.border }}>
                    <p className="text-base font-bold mb-2" style={{ color: theme.text }}>Conta de {nomeCurto}</p>
                    <p className="text-sm leading-relaxed mb-5" style={{ color: theme.muted }}>
                      Aqui {nomeCurto} vê os próprios dados, a segurança do acesso e a aparência do app.
                      Contas familiares e acessos são exclusivos do titular.
                    </p>
                    <button onClick={sairDaPrevia} className="w-full min-h-12 py-3.5 rounded-2xl text-sm font-bold text-white" style={{ background: theme.accent }}>
                      Sair da pré-visualização
                    </button>
                  </div>
                )}
                {(tab === "perfil" || tab === "familia") && !verComo && (
                  <PerfilPage secao={tab === "familia" ? "familia" : "conta"} onAbrirFamilia={() => abrirTela("familia")}
                    fonte={fonte} onFonte={setFonte} theme={theme} themePref={themePref} setThemePref={setThemePref} contas={contas} conta={conta}
                    hidden={hidden} nivel={nivel} onNivelChange={setNivel} onUpdateConta={updateConta}
                    onSalvarPermissoes={salvarPermissoes} onVerComo={verAppComo} showToast={showToast}
                    onLogout={() => setShowLogoutConfirm(true)}
                    onAporteRecorrente={() => irParaAporte(conta.aporteMensal, "recorrente")} />
                )}
              </>
            )}
          </div>
        )}

        {podeAportar && (
          <div className={tab === "aportes" ? "tab-enter" : "hidden"}>
            <AportesPage key={`${conta.id}-${aporteKey}`} theme={theme} conta={conta} hidden={hidden} isTitular={contaPropria}
              planos={verComo ? [] : contas.filter((c) => c.pessoa === conta.pessoa)} onTrocarPlano={setContaAtivaId}
              initialValor={aporteInicial} initialTipo={aporteInicialTipo} showToast={showToast}
              onDone={() => { setAporteInicial(undefined); setAporteInicialTipo("extra"); setAporteKey((k) => k + 1); setTab("inicio"); }} />
          </div>
        )}
        {tab === "aportes" && !podeAportar && <div className="tab-enter">{conteudoBloqueado("aportes")}</div>}
      </main>

      {/* bottom nav: "Aportar" é uma ação, com visual de botão (lei de Jakob) */}
      <nav aria-label="Navegação principal" className="flex-shrink-0 flex items-end justify-around px-2 pt-3 pb-5"
        style={{ background: theme.navBg, borderTop: `1px solid ${theme.border}`, boxShadow: theme.navShadow }}>
        {navItems.map((item) => {
          const ativa = tab === item.id;
          const trancada = bloqueada(item.id);
          if (item.id === "aportes") {
            return (
              <button key={item.id} onClick={() => { haptic("light"); setTab(item.id); }}
                aria-current={ativa ? "page" : undefined}
                aria-label={trancada ? `${item.label} (bloqueado nesta conta)` : item.label}
                className="relative flex-1 min-h-16 flex flex-col items-center justify-end gap-1 px-2 py-1.5">
                <span className="w-11 h-11 -mt-1 rounded-2xl flex items-center justify-center text-white transition-transform active:scale-95"
                  style={{ background: `linear-gradient(135deg, ${cor}, ${theme.accentMid})`, boxShadow: `0 6px 16px ${cor}55`, opacity: trancada ? 0.5 : 1 }}>
                  {trancada ? <Icon.Lock size={20} /> : item.icon}
                </span>
                <span className={`text-sm ${ativa ? "font-bold" : "font-medium"}`} style={{ color: ativa ? theme.accentText : theme.muted }}>{item.label}</span>
                <span className="w-1.5 h-1.5 rounded-full" aria-hidden="true" style={{ background: ativa ? DESTAQUE.dourado : "transparent" }} />
              </button>
            );
          }
          return (
            <button key={item.id} onClick={() => { haptic("light"); setTab(item.id); }}
              aria-current={ativa ? "page" : undefined}
              aria-label={trancada ? `${item.label} (bloqueado nesta conta)` : item.label}
              className="relative flex-1 min-h-16 flex flex-col items-center justify-end gap-1 px-2 py-1.5 rounded-xl transition-all"
              style={{ color: ativa ? theme.accentText : theme.muted }}>
              <span className="relative">
                {item.icon}
                {trancada && (
                  <span className="absolute -top-1 -right-2 rounded-full p-0.5" style={{ background: theme.navBg, color: theme.muted }}>
                    <Icon.Lock size={10} sw={2.4} />
                  </span>
                )}
              </span>
              <span className={`text-sm ${ativa ? "font-bold" : "font-medium"}`}>{item.label}</span>
              {/* espaço do ponto sempre reservado, para os rótulos ficarem alinhados */}
              <span className="w-1.5 h-1.5 rounded-full" aria-hidden="true" style={{ background: ativa ? DESTAQUE.dourado : "transparent" }} />
            </button>
          );
        })}
      </nav>

      {showChat && <Chat key={chatHuman ? "humano" : "ia"} theme={theme} startHuman={chatHuman} onClose={() => setShowChat(false)} />}

      {showLogoutConfirm && (
        <Sheet theme={theme} label="Confirmar saída" onClose={() => setShowLogoutConfirm(false)}>
          <p className="text-lg font-bold mb-1 text-center" style={{ color: theme.text }}>Deseja sair?</p>
          <p className="text-sm text-center mb-6" style={{ color: theme.muted }}>Você será redirecionado para a tela de login.</p>
          <div className="flex gap-3">
            <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 min-h-12 py-3.5 rounded-2xl text-sm font-semibold"
              style={{ background: theme.inputBg, color: theme.text }}>
              Cancelar
            </button>
            <button onClick={sair} className="flex-1 min-h-12 py-3.5 rounded-2xl text-white text-sm font-bold" style={{ background: "#B42318" }}>
              Sair
            </button>
          </div>
        </Sheet>
      )}

      {showSwitcher && (
        <Sheet theme={theme} label="Trocar de plano ou pessoa" onClose={() => setShowSwitcher(false)}>
          <ContaSwitcher contas={contas} contaAtiva={contaAtivaId} theme={theme} hidden={hidden}
            onSelect={trocarConta} onClose={() => setShowSwitcher(false)} />
        </Sheet>
      )}

      {showMenu && (
        <MenuPanel theme={theme} grupos={gruposMenu} onClose={() => setShowMenu(false)}
          cabecalho={
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background: cor }}>
                {conta.initials}
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold truncate" style={{ color: theme.text }}>{conta.nome}</p>
                <p className="text-xs" style={{ color: theme.muted }}>
                  {verComo ? `Pré-visualização · ${conta.parentesco}` : `${conta.parentesco} · ${PLANO.nome}`}
                </p>
              </div>
            </div>
          }
          rodape={
            <div className="space-y-3 pb-4">
              {verComo ? (
                <button onClick={() => { setShowMenu(false); sairDaPrevia(); }}
                  className="w-full min-h-12 py-3.5 rounded-2xl text-sm font-bold text-white" style={{ background: theme.accent }}>
                  Sair da pré-visualização
                </button>
              ) : (
                <button onClick={() => { setShowMenu(false); setShowLogoutConfirm(true); }}
                  className="w-full min-h-12 py-3.5 rounded-2xl text-sm font-medium flex items-center justify-center gap-2"
                  style={{ background: theme.surface, color: theme.danger, border: `1px solid ${theme.dangerBorder}` }}>
                  <Icon.Logout /> Sair da conta
                </button>
              )}
              <p className="text-xs text-center leading-relaxed px-2" style={{ color: theme.muted }}>
                {FUSESC.nome} · CNPJ {FUSESC.cnpj}
              </p>
            </div>
          } />
      )}

      {menuSheet === "extrato" && (
        <Sheet theme={theme} label="Extrato" onClose={() => setMenuSheet(null)}>
          <ExtratoSheet theme={theme} conta={conta} hidden={hidden} onClose={() => setMenuSheet(null)} showToast={showToast} />
        </Sheet>
      )}
      {menuSheet === "informe" && (
        <Sheet theme={theme} label="Informe de rendimentos" onClose={() => setMenuSheet(null)}>
          <InformeSheet theme={theme} conta={conta} hidden={hidden} onClose={() => setMenuSheet(null)} showToast={showToast} />
        </Sheet>
      )}
      {menuSheet === "resgate" && (
        <Sheet theme={theme} label="Regras de resgate" onClose={() => setMenuSheet(null)}>
          <ResgateSheet theme={theme} conta={conta} hidden={hidden} onClose={() => setMenuSheet(null)} />
        </Sheet>
      )}
      {menuSheet === "recorrencia" && (
        <Sheet theme={theme} label="Aporte recorrente" onClose={() => setMenuSheet(null)}>
          <RecorrenciaSheet theme={theme} conta={conta} hidden={hidden} onClose={() => setMenuSheet(null)}
            onCancelar={() => { updateConta({ ...conta, recorrenteAtiva: false }); setMenuSheet(null); showToast("Aporte recorrente cancelado"); }}
            onAlterar={() => { setMenuSheet(null); irParaAporte(conta.aporteMensal, "recorrente"); }} />
        </Sheet>
      )}
      {menuSheet === "perfilInvest" && (
        <Sheet theme={theme} label="Perfil de investimento" onClose={() => setMenuSheet(null)}>
          <PerfilInvestSheet theme={theme} conta={conta} hidden={hidden} onClose={() => setMenuSheet(null)}
            onSave={(perfil) => { updateConta({ ...conta, perfil }); setMenuSheet(null); showToast(`Perfil ${PERFIL_LABEL[perfil]} salvo. A FUSESC vai ajustar a distribuição.`); }} />
        </Sheet>
      )}
      {menuSheet === "portabilidade" && (
        <Sheet theme={theme} label="Portabilidade" onClose={() => setMenuSheet(null)}>
          <PortabilidadeSheet theme={theme} conta={conta} onClose={() => setMenuSheet(null)} />
        </Sheet>
      )}
      {menuSheet === "nivel" && (
        <Sheet theme={theme} label="Nível de cadastro" onClose={() => setMenuSheet(null)}>
          <NivelSheet theme={theme} nivel={nivel} onNivelChange={setNivel} onClose={() => setMenuSheet(null)} showToast={showToast} />
        </Sheet>
      )}
      {menuSheet === "seguranca" && (
        <Sheet theme={theme} label="Segurança" onClose={() => setMenuSheet(null)}>
          <SegurancaSheet theme={theme} onClose={() => setMenuSheet(null)} showToast={showToast} />
        </Sheet>
      )}

      {conhecer && (
        <Sheet theme={theme} label={PRODUTOS[conhecer].nome} onClose={() => setConhecer(null)}>
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: theme.accentText }}>{PRODUTOS[conhecer].chamada}</p>
          <p className="text-xl font-bold mt-0.5 mb-2 pr-10" style={{ color: theme.text }}>{PRODUTOS[conhecer].nome}</p>
          <p className="text-sm leading-relaxed mb-4" style={{ color: theme.muted }}>{PRODUTOS[conhecer].resumo}</p>
          <ul className="space-y-2 mb-6">
            {PRODUTOS[conhecer].pontos.map((p) => (
              <li key={p} className="flex items-start gap-2 text-sm" style={{ color: theme.text }}>
                <span className="mt-0.5 flex-shrink-0" style={{ color: theme.positive }}><Icon.Check /></span>{p}
              </li>
            ))}
          </ul>
          <button onClick={() => { setConhecer(null); showToast("Recebemos seu interesse. A equipe da FUSESC vai entrar em contato."); }}
            className="w-full min-h-12 py-3.5 rounded-2xl text-sm font-bold text-white mb-2" style={{ background: theme.accent }}>
            Quero contratar
          </button>
          <button onClick={() => { setConhecer(null); abrirChat(true); }}
            className="w-full min-h-11 text-sm font-semibold" style={{ color: theme.accentText }}>
            Tirar dúvidas com um atendente
          </button>
        </Sheet>
      )}

      {showNotif && (
        <Sheet theme={theme} label="Notificações" onClose={() => setShowNotif(false)}>
          <NotificacoesSheet theme={theme} notificacoes={notificacoes} hidden={hidden} onClose={() => setShowNotif(false)}
            onMarcarLida={(id) => setNotificacoes((ns) => ns.map((n) => (n.id === id ? { ...n, lida: true } : n)))} />
        </Sheet>
      )}
    </div>
  );
}
