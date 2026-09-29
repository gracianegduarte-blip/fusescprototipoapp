import { useEffect, useState, type ReactNode } from "react";

// Moldura de iPhone 17 Pro Max (tela lógica 440×956) para visualizar o protótipo no desktop.
// Em telas pequenas (celular de verdade) o app ocupa a tela inteira, sem moldura.
const W = 440;
const H = 956;
const BORDA = 14;
const MIN_LARGURA_MOLDURA = 600;

// Sheets e toasts usam este elemento como raiz, para ficarem dentro da tela do aparelho.
export const SCREEN_ID = "app-screen";

function useEscala() {
  const calc = () => ({
    moldura: window.innerWidth >= MIN_LARGURA_MOLDURA,
    k: Math.min(1, (window.innerHeight - 48) / (H + BORDA * 2), (window.innerWidth - 48) / (W + BORDA * 2)),
  });
  const [s, setS] = useState(calc);
  useEffect(() => {
    const onResize = () => setS(calc());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return s;
}

function BarraStatus() {
  const [hora, setHora] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setHora(new Date()), 30_000);
    return () => window.clearInterval(t);
  }, []);
  const hhmm = hora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex-shrink-0 relative flex items-center justify-between px-9 select-none"
      style={{ height: 58, background: "var(--sb-bg, #0D2118)", color: "var(--sb-fg, #fff)", transition: "background 0.3s, color 0.3s" }}
      aria-hidden="true">
      <span className="text-[15px] font-semibold tracking-tight w-16">{hhmm}</span>
      {/* Dynamic Island */}
      <div className="absolute left-1/2 -translate-x-1/2 top-[11px] rounded-full bg-black" style={{ width: 126, height: 37 }} />
      <span className="flex items-center gap-1.5 w-16 justify-end">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor">
          <rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5.5" width="3" height="6.5" rx="1" />
          <rect x="10" y="3" width="3" height="9" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" />
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
          <path d="M8 2.2c2.3 0 4.4.9 6 2.4l1.1-1.2A10.2 10.2 0 008 .6 10.2 10.2 0 00.9 3.4L2 4.6a8.6 8.6 0 016-2.4z" />
          <path d="M8 5.6c1.4 0 2.6.5 3.6 1.4l1.1-1.2A7 7 0 008 4a7 7 0 00-4.7 1.8L4.4 7c1-.9 2.2-1.4 3.6-1.4z" />
          <path d="M8 9a2 2 0 011.3.5L8 11 6.7 9.5A2 2 0 018 9z" />
        </svg>
        <svg width="27" height="13" viewBox="0 0 27 13" fill="none">
          <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" stroke="currentColor" strokeOpacity="0.4" />
          <rect x="2" y="2" width="18" height="9" rx="2" fill="currentColor" />
          <path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2z" fill="currentColor" fillOpacity="0.4" />
        </svg>
      </span>
    </div>
  );
}

export default function PhoneFrame({ children }: { children: ReactNode }) {
  const { moldura, k } = useEscala();

  // A página nunca deve rolar: foco ou scrollIntoView dentro do app poderiam deslocar a moldura e deixá-la presa.
  useEffect(() => {
    const travar = () => { if (window.scrollX || window.scrollY) window.scrollTo(0, 0); };
    window.addEventListener("scroll", travar);
    return () => window.removeEventListener("scroll", travar);
  }, []);
  const travarContainer = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop || el.scrollLeft) { el.scrollTop = 0; el.scrollLeft = 0; }
  };

  if (!moldura) {
    return <div id={SCREEN_ID} className="size-full relative overflow-hidden">{children}</div>;
  }

  const botao = (lado: "l" | "r", top: number, h: number) => (
    <span className="absolute rounded-sm" style={{
      [lado === "l" ? "left" : "right"]: -3, top, width: 4, height: h,
      background: "linear-gradient(90deg, #3a3d42, #6b6f76, #3a3d42)",
    }} />
  );

  return (
    <div onScroll={travarContainer} className="size-full flex items-center justify-center overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 30%, #1A3D28 0%, #0D2118 55%, #07130D 100%)" }}>
      <div className="relative flex-shrink-0"
        style={{ width: W + BORDA * 2, height: H + BORDA * 2, transform: `scale(${k})`, transformOrigin: "center" }}>
        {/* botões laterais: ação, volume +/−, energia e controle da câmera */}
        {botao("l", 190, 34)}
        {botao("l", 250, 62)}
        {botao("l", 326, 62)}
        {botao("r", 270, 100)}
        {botao("r", 560, 70)}

        {/* corpo em titânio */}
        <div className="absolute inset-0" style={{
          borderRadius: 74,
          background: "linear-gradient(145deg, #5b5f66 0%, #2b2e33 30%, #1c1e21 60%, #4a4e55 100%)",
          boxShadow: "0 40px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06) inset",
        }} />
        {/* borda preta da tela */}
        <div className="absolute bg-black" style={{ inset: 4, borderRadius: 70 }} />

        {/* tela */}
        <div className="absolute overflow-hidden flex flex-col" style={{ inset: BORDA, borderRadius: 60, background: "var(--sb-bg, #0D2118)" }}>
          <BarraStatus />
          <div id={SCREEN_ID} className="flex-1 min-h-0 relative overflow-hidden" style={{ transform: "translateZ(0)" }}>
            {children}
          </div>
          {/* indicador de início */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-2 rounded-full pointer-events-none z-[300]"
            style={{ width: 144, height: 5, background: "var(--sb-fg, #fff)", opacity: 0.55 }} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
