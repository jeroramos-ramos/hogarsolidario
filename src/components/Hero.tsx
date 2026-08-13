// Hero full-bleed con overlay oscuro y el h1 de la puerta encima.
// Altura escalonada para dar aire al texto sin dominar la pantalla.
// object-position bias hacia la izquierda para mantener a la familia visible
// en el crop de móvil (imagen es 3.2:1 y la pantalla es más cuadrada).
export function Hero() {
  return (
    <div className="relative w-full bg-ink overflow-hidden isolate">
      <picture>
        <source media="(max-width: 640px)" srcSet="/hero-mobile.jpg" />
        <img
          src="/hero.jpg"
          alt="Familia y trabajador con casco mirando un monumento de reconstrucción al atardecer, banderas de Colombia y ciudad de fondo."
          className="w-full h-[360px] sm:h-[440px] md:h-[520px] lg:h-[580px] object-cover"
          style={{ objectPosition: '40% 55%' }}
          width={1920}
          height={599}
          fetchPriority="high"
          decoding="async"
        />
      </picture>

      {/* Overlay uniforme — sin gradiente, se mantiene el diseño sobrio. */}
      <div aria-hidden="true" className="absolute inset-0 bg-ink/60" />

      {/* Texto sobre la imagen. items-center vertical, wrap centrado horizontal. */}
      <div className="absolute inset-0 flex items-center">
        <div className="wrap w-full">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-signal m-0">
            Red solidaria de vivienda · zonas afectadas
          </p>
          <h1 className="text-[clamp(30px,5.5vw,52px)] font-bold leading-[1.02] text-white mt-3 max-w-[22ch] [text-wrap:balance]">
            Un techo mientras
            <br />
            volvemos a levantar
            <br />
            <span className="text-[#DDE6E3] font-semibold">lo que se cayó.</span>
          </h1>
        </div>
      </div>
    </div>
  );
}
