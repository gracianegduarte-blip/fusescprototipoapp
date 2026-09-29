import type { ReactNode } from "react";
import type { Theme } from "../shared";

// Barra de ação fixa no rodapé da área rolável (acima do menu inferior).
export default function StickyFooter({ theme, children }: { theme: Theme; children: ReactNode }) {
  return (
    <div className="sticky bottom-0 -mx-4 px-4 pt-3 pb-3 z-20"
      style={{ background: theme.bg, borderTop: `1px solid ${theme.border}` }}>
      {children}
    </div>
  );
}
