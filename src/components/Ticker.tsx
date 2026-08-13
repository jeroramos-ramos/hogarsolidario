type TickerProps = {
  inmuebles: number;
  familias: number;
};

export function Ticker({ inmuebles, familias }: TickerProps) {
  return (
    <div className="bg-ink text-[#DDE6E3] font-mono text-[11.5px] tracking-[0.04em] py-[9px]">
      <div className="wrap flex items-center gap-[14px] flex-wrap">
        <span
          aria-hidden="true"
          className="w-[7px] h-[7px] rounded-full bg-signal flex-none animate-pulse"
        />
        <span>SISMO 10 AGO 2026 · M7.4</span>
        <span>VALLE · RISARALDA · QUINDÍO · CALDAS · CHOCÓ</span>
        <span aria-hidden="true" className="text-muted">·</span>
        <span>
          <b className="text-white font-medium">{inmuebles}</b> INMUEBLES
        </span>
        <span aria-hidden="true" className="text-muted">·</span>
        <span>
          <b className="text-white font-medium">{familias}</b> FAMILIAS BUSCANDO
        </span>
      </div>
    </div>
  );
}
