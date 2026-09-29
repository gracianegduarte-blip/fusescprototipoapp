import { Icon, type Theme } from "../shared";

export default function LockedState({ theme, titulo, descricao, onSolicitar, onVoltar, labelSolicitar = "Solicitar acesso", labelVoltar = "Voltar à minha conta" }: {
  theme: Theme; titulo: string; descricao: string; onSolicitar: () => void; onVoltar: () => void;
  labelSolicitar?: string; labelVoltar?: string;
}) {
  return (
    <div className="flex flex-col items-center text-center px-4 py-14">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: theme.tagBg, color: theme.accentText }}>
        <Icon.Lock size={28} />
      </div>
      <h2 className="text-lg font-bold mb-2" style={{ color: theme.text }}>{titulo}</h2>
      <p className="text-sm leading-relaxed mb-7 max-w-xs" style={{ color: theme.muted }}>{descricao}</p>
      <div className="w-full max-w-xs space-y-3">
        <button onClick={onSolicitar}
          className="w-full min-h-12 py-3.5 rounded-2xl text-sm font-bold text-white"
          style={{ background: theme.accent }}>
          {labelSolicitar}
        </button>
        <button onClick={onVoltar}
          className="w-full min-h-12 py-3.5 rounded-2xl text-sm font-semibold"
          style={{ background: theme.surface, color: theme.text, border: `1px solid ${theme.border}` }}>
          {labelVoltar}
        </button>
      </div>
    </div>
  );
}
