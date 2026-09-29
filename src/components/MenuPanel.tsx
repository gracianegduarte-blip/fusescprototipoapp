import { useEffect, useRef, type ReactNode } from "react";
import { Icon, type Theme } from "../shared";

export type MenuItem = { id: string; label: string; desc?: string; icon: ReactNode; onClick: () => void; bloqueado?: boolean };
export type MenuGrupo = { titulo: string; itens: MenuItem[] };

// Menu completo do app (ícone ☰ no topo), em tela cheia sobre o conteúdo.
export default function MenuPanel({ theme, cabecalho, grupos, rodape, onClose }: {
  theme: Theme; cabecalho: ReactNode; grupos: MenuGrupo[]; rodape?: ReactNode; onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCloseRef.current(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Menu"
      className="absolute inset-0 z-50 flex flex-col outline-none"
      style={{ background: theme.bg, animation: "fadeSlideIn 0.2s ease-out both" }}>
      <div className="flex-shrink-0 px-5 pt-5 pb-4 flex items-start justify-between gap-3" style={{ background: theme.headerBg, borderBottom: `1px solid ${theme.border}` }}>
        <div className="min-w-0 flex-1">{cabecalho}</div>
        <button onClick={onClose} aria-label="Fechar menu"
          className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: theme.bellBg, color: theme.text }}>
          <Icon.Close />
        </button>
      </div>

      <nav aria-label="Menu completo" className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {grupos.map((g) => (
          <section key={g.titulo} aria-label={g.titulo}>
            <p className="text-xs font-semibold tracking-wide uppercase mb-2 px-1" style={{ color: theme.muted }}>{g.titulo}</p>
            <div className="rounded-2xl overflow-hidden" style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
              {g.itens.map((it) => (
                <button key={it.id} onClick={it.onClick} aria-disabled={it.bloqueado}
                  className="w-full min-h-14 flex items-center gap-3 px-4 py-3 text-left border-b last:border-0"
                  style={{ borderColor: theme.rowBorder, opacity: it.bloqueado ? 0.6 : 1 }}>
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: theme.tagBg, color: theme.accentText }}>
                    {it.icon}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold" style={{ color: theme.text }}>{it.label}</span>
                    {it.desc && <span className="block text-xs" style={{ color: theme.muted }}>{it.desc}</span>}
                  </span>
                  <span style={{ color: theme.muted }}>{it.bloqueado ? <Icon.Lock size={16} /> : <Icon.ChevronRight />}</span>
                </button>
              ))}
            </div>
          </section>
        ))}
        {rodape}
      </nav>
    </div>
  );
}
