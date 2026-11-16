"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/lib/use-hydrated";

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
  const ready = useHydrated();

  function goTo(index: number) {
    const target = Math.max(0, Math.min(slides.length - 1, index));
    track.current?.scrollTo({ left: target * track.current.clientWidth });
  }

  return (
    <section
      aria-label="Imagens para destravar a lógica"
      aria-roledescription="carrossel"
    >
      <div
        ref={track}
        role="group"
        aria-label="Galeria de imagens"
        tabIndex={0}
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
              sizes="(min-width: 1216px) 430px, (min-width: 1024px) calc(40vw - 58px), (min-width: 640px) calc(100vw - 64px), calc(100vw - 40px)"
              loading={index === 0 ? "eager" : "lazy"}
              draggable={false}
              className="object-cover"
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between gap-4">
        <p
          aria-live="polite"
          aria-atomic="true"
          className="text-sm font-medium"
        >
          {slides[active].title}
          <span className="mt-1 block font-mono text-xs text-muted-foreground">
            {active + 1} / {slides.length}
          </span>
        </p>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11"
            aria-label="Imagem anterior"
            title="Imagem anterior"
            disabled={!ready || active === 0}
            onClick={() => goTo(active - 1)}
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11"
            aria-label="Próxima imagem"
            title="Próxima imagem"
            disabled={!ready || active === slides.length - 1}
            onClick={() => goTo(active + 1)}
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
  );
}
