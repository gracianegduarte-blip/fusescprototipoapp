import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon, type Theme } from "../shared";
import { SCREEN_ID } from "./PhoneFrame";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

// Bottom sheet acessível: role=dialog, ESC, foco preso, botão fechar e arrastar para baixo.
// Renderizado em um portal para não herdar transform/overflow das páginas.
export default function Sheet({ theme, label, onClose, children }: {
  theme: Theme; label: string; onClose: () => void; children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const startY = useRef(0);
  const [dy, setDy] = useState(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panelRef.current?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (nodes.length === 0) {
        e.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus?.({ preventScroll: true });
    };
  }, []);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    startY.current = e.clientY;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragging) setDy(Math.max(0, e.clientY - startY.current));
  };
  const onPointerUp = () => {
    if (!dragging) return;
    setDragging(false);
    if (dy > 110) onClose();
    else setDy(0);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col justify-end"
      style={{ background: theme.overlay, animation: "fadeIn 0.18s ease-out backwards" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}
        className="relative flex flex-col rounded-t-3xl outline-none w-full"
        style={{
          background: theme.surface, color: theme.text, maxHeight: "92%",
          transform: `translateY(${dy}px)`,
          transition: dragging ? "none" : "transform 0.2s ease",
          animation: "sheetUp 0.25s ease-out backwards",
        }}>
        <div className="flex-shrink-0 pt-3 pb-4 flex justify-center cursor-grab"
          style={{ touchAction: "none" }}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove}
          onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
          <div className="w-10 h-1 rounded-full" style={{ background: theme.border }} />
        </div>
        <button type="button" onClick={onClose} aria-label="Fechar"
          className="absolute top-1 right-2 w-11 h-11 rounded-full flex items-center justify-center"
          style={{ color: theme.muted }}>
          <Icon.Close />
        </button>
        <div className="overflow-y-auto px-6 pb-8 flex-1">
          {children}
        </div>
      </div>
    </div>,
    document.getElementById(SCREEN_ID) ?? document.body,
  );
}
