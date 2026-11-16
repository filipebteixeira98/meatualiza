"use client";

import Image from "next/image";
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/lib/use-hydrated";

const AUTOPLAY_INTERVAL_MS = 5_000;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToMotionPreference(onChange: () => void) {
  const preference = window.matchMedia(REDUCED_MOTION_QUERY);
  preference.addEventListener("change", onChange);
  return () => preference.removeEventListener("change", onChange);
}

const slides = [
  {
    src: "/images/landing/untangle.webp",
    title: "Desate a dúvida.",
    alt: "Fita prateada desfazendo um nó e abrindo um caminho.",
  },
  {
    src: "/images/landing/connect.webp",
    title: "Conecte as ideias.",
    alt: "Fita prateada conectando plataformas por caminhos que se encontram.",
  },
  {
    src: "/images/landing/advance.webp",
    title: "Um passo adiante.",
    alt: "Fita prateada formando degraus que sobem em direção a um arco aberto.",
  },
];

export function LearningCarousel() {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const ready = useHydrated();
  const reducedMotion = useSyncExternalStore(
    subscribeToMotionPreference,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => true,
  );
  const rotating = playing && !reducedMotion;
  const rotationLabel = reducedMotion
    ? "Avanço automático desativado por movimento reduzido"
    : playing
      ? "Pausar avanço automático"
      : "Iniciar avanço automático";

  function goTo(index: number) {
    const target = Math.max(0, Math.min(slides.length - 1, index));
    track.current?.scrollTo({ left: target * track.current.clientWidth });
  }

  const advance = useEffectEvent(() => {
    if (!document.hidden) goTo((active + 1) % slides.length);
  });

  useEffect(() => {
    if (!rotating || hovered) return;
    const timer = window.setInterval(() => advance(), AUTOPLAY_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [rotating, hovered]);

  return (
    <section
      aria-label="Imagens para destravar a lógica"
      aria-roledescription="carrossel"
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setHovered(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") setHovered(false);
      }}
      onFocusCapture={(event) => {
        if (event.target.matches(":focus-visible")) setPlaying(false);
      }}
      className="relative"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-2 bottom-2 z-10 size-11 rounded-full bg-background/40 text-foreground/80 hover:bg-background/70 hover:text-foreground dark:hover:bg-background/70"
        aria-label={rotationLabel}
        title={rotationLabel}
        disabled={!ready || reducedMotion}
        onClick={() => {
          setPlaying(!playing);
          setHovered(false);
        }}
      >
        {rotating ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
      </Button>
      <div
        ref={track}
        role="group"
        aria-label="Galeria de imagens"
        tabIndex={0}
        onPointerDown={() => setPlaying(false)}
        onScroll={(event) => {
          const { scrollLeft, clientWidth } = event.currentTarget;
          setActive(
            Math.max(
              0,
              Math.min(slides.length - 1, Math.round(scrollLeft / clientWidth)),
            ),
          );
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            setPlaying(false);
            goTo(active + (event.key === "ArrowRight" ? 1 : -1));
          }
        }}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-2xl border border-border bg-card outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background motion-safe:scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, index) => (
          <div
            key={slide.src}
            role="group"
            aria-roledescription="slide"
            aria-label={`Imagem ${index + 1} de ${slides.length}`}
            aria-hidden={index !== active}
            className="relative aspect-[4/3] w-full shrink-0 snap-start snap-always"
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              sizes="(min-width: 1216px) 608px, (min-width: 1024px) calc(55vw - 62px), (min-width: 640px) calc(100vw - 64px), calc(100vw - 40px)"
              loading={index === 0 ? "eager" : "lazy"}
              draggable={false}
              className="object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-background/80 via-transparent to-background/30" />
            <p className="pointer-events-none absolute inset-x-5 top-5 text-base font-medium tracking-tight text-foreground sm:text-lg">
              {slide.title}
            </p>
          </div>
        ))}
      </div>
      <p
        aria-live={rotating && !hovered ? "off" : "polite"}
        aria-atomic="true"
        className="sr-only"
      >
        {slides[active].title} {active + 1} de {slides.length}
      </p>
      <div
        role="group"
        aria-label="Escolher imagem"
        className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2"
      >
        {slides.map((slide, index) => (
          <Button
            key={slide.src}
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 rounded-full hover:bg-background/40 dark:hover:bg-background/40"
            aria-label={`Mostrar imagem ${index + 1}: ${slide.title}`}
            aria-current={index === active ? "true" : undefined}
            disabled={!ready}
            onClick={() => {
              setPlaying(false);
              goTo(index);
            }}
          >
            <span
              aria-hidden="true"
              className={`rounded-full ${index === active ? "size-2 bg-foreground" : "size-1.5 bg-foreground/40"}`}
            />
          </Button>
        ))}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute top-1/2 left-1 z-10 size-11 -translate-y-1/2 rounded-full bg-background/30 text-foreground/70 hover:bg-background/70 hover:text-foreground dark:hover:bg-background/70"
        aria-label="Imagem anterior"
        title="Imagem anterior"
        disabled={!ready || active === 0}
        onClick={() => {
          setPlaying(false);
          goTo(active - 1);
        }}
      >
        <ChevronLeft aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute top-1/2 right-1 z-10 size-11 -translate-y-1/2 rounded-full bg-background/30 text-foreground/70 hover:bg-background/70 hover:text-foreground dark:hover:bg-background/70"
        aria-label="Próxima imagem"
        title="Próxima imagem"
        disabled={!ready || active === slides.length - 1}
        onClick={() => {
          setPlaying(false);
          goTo(active + 1);
        }}
      >
        <ChevronRight aria-hidden="true" />
      </Button>
    </section>
  );
}
