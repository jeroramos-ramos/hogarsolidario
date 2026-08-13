// Hero full-bleed que va encima del ticker. Aspect ratio 3.2:1 heredado
// del archivo. En móvil el object-fit:cover recorta a la derecha para
// mantener el foco visual (familia mirando el monumento) sin dominar la
// pantalla. srcset entrega la variante mobile en pantallas pequeñas.
export function Hero() {
  return (
    <div className="w-full bg-ink overflow-hidden">
      <picture>
        <source media="(max-width: 640px)" srcSet="/hero-mobile.jpg" />
        <img
          src="/hero.jpg"
          alt="Familia y trabajador con casco mirando un monumento de reconstrucción al atardecer, banderas de Colombia y ciudad de fondo."
          className="w-full h-[180px] sm:h-[280px] md:h-[360px] lg:h-[420px] object-cover object-center block"
          width={1920}
          height={599}
          fetchPriority="high"
          decoding="async"
        />
      </picture>
    </div>
  );
}
