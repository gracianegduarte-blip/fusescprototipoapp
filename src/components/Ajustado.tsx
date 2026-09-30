import { useEffect, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";

// Mantém um valor (ex.: "R$ 1.200.000,00") em uma linha só, dentro da caixa:
// se não couber, reduz a fonte na medida exata, até o mínimo de `min` do tamanho original.
export default function Ajustado({ children, className = "", style, min = 0.6 }: {
  children: ReactNode; className?: string; style?: CSSProperties; min?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  const ajustar = () => {
    const el = ref.current;
    if (!el) return;
    el.style.fontSize = "";
    const disponivel = el.clientWidth;
    const precisa = el.scrollWidth;
    if (disponivel > 0 && precisa > disponivel) {
      const base = parseFloat(getComputedStyle(el).fontSize);
      el.style.fontSize = `${Math.max(min, (disponivel / precisa) * 0.98) * base}px`;
    }
  };

  // Reajusta a cada renderização (o valor pode ter mudado)...
  useLayoutEffect(ajustar);
  // ...e quando a caixa muda de largura (tamanho do texto, giro da tela).
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => ajustar());
    ro.observe(el.parentElement ?? el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <span ref={ref} className={`block whitespace-nowrap overflow-hidden text-ellipsis ${className}`} style={style}>
      {children}
    </span>
  );
}
