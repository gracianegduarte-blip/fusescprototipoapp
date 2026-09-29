import { Icon, type Notificacao, type Theme } from "../shared";

const mascararValores = (texto: string) => texto.replace(/R\$\s?[\d.]+(,\d{2})?/g, "R$ ••••");

export default function NotificacoesSheet({ theme, notificacoes, hidden, onClose, onMarcarLida }: {
  theme: Theme; notificacoes: Notificacao[]; hidden: boolean; onClose: () => void; onMarcarLida: (id: number) => void;
}) {
  const naoLidas = notificacoes.filter((n) => !n.lida);
  const marcarTodas = () => naoLidas.forEach((n) => onMarcarLida(n.id));

  const iconeDe = (icon: Notificacao["icon"]) =>
    icon === "rendimento" ? <Icon.Trend size={16} sw={2} />
    : icon === "aporte" ? <Icon.ArrowUp size={16} sw={2} />
    : icon === "meta" ? <Icon.Target />
    : <Icon.Star />;

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-3 mb-5 pr-10">
        <p className="text-base font-bold" style={{ color: theme.text }}>Notificações</p>
        <button onClick={marcarTodas} disabled={naoLidas.length === 0}
          className="min-h-11 text-xs font-medium px-3 py-1.5 rounded-xl disabled:opacity-50"
          style={{ background: theme.tagBg, color: theme.accentText }}>
          Marcar todas como lidas
        </button>
      </div>
      <div className="space-y-3">
        {notificacoes.map((n) => (
          <button key={n.id} onClick={() => onMarcarLida(n.id)}
            className="w-full text-left rounded-2xl p-4 flex items-start gap-3 transition-all"
            style={{
              background: n.lida ? theme.inputBg : theme.accentTag,
              border: `1px solid ${n.lida ? theme.border : theme.accent + "44"}`,
              borderLeft: n.lida ? `1px solid ${theme.border}` : `3px solid ${theme.accent}`,
            }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: n.lida ? theme.tagBg : theme.accent + "22", color: n.lida ? theme.muted : theme.accentText }}>
              {iconeDe(n.icon)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold truncate" style={{ color: theme.text }}>{n.titulo}</p>
                {!n.lida && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: theme.accent }} aria-label="Não lida" />}
              </div>
              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: theme.muted }}>
                {hidden ? mascararValores(n.corpo) : n.corpo}
              </p>
              <p className="text-xs mt-1.5 font-medium" style={{ color: theme.muted }}>{n.hora}</p>
            </div>
          </button>
        ))}
      </div>
      <button onClick={onClose}
        className="w-full min-h-12 py-3.5 rounded-2xl text-sm font-semibold mt-5"
        style={{ background: theme.inputBg, color: theme.text }}>
        Fechar
      </button>
    </div>
  );
}
