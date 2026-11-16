import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { monitoria } from "@/lib/monitoria";
import { LearningCarousel } from "./learning-carousel";

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="site-container grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.2fr_0.8fr] lg:gap-20 lg:py-24"
    >
      <div>
        <p className="eyebrow mb-6">LÓGICA DE PROGRAMAÇÃO / MONITORIA</p>
        <h1
          id="hero-title"
          className="text-[clamp(3rem,6.4vw,5.75rem)] leading-[1.02] font-medium tracking-[-0.065em]"
        >
          Deu um nó
          <br />
          <span className="text-muted-foreground">na lógica?</span>
        </h1>
        <p className="mt-6 max-w-md text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
          Traz a dúvida. A gente constrói o raciocínio junto, um passo de cada
          vez.
        </p>
        <div className="mt-8 flex flex-col gap-3 min-[400px]:flex-row">
          <Button asChild size="lg" className="h-12 rounded-lg px-6">
            <Link href="/entrar">
              Acessar plataforma <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="lg"
            className="h-12 rounded-lg px-5"
          >
            <Link href="#como-funciona">
              Como funciona <ArrowDown aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
      <div className="min-w-0">
        <LearningCarousel />
        <aside
          aria-label="Agenda da monitoria"
          className="mt-5 border-t border-border pt-5"
        >
          <p className="text-sm font-medium">
            <span>{monitoria.instituicao}</span>
            <span className="text-muted-foreground">
              {" "}
              · <span className="sr-only">Laboratório </span>L7
            </span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Segundas e quartas <span aria-hidden="true">·</span>{" "}
            <span className="font-mono text-xs text-foreground">
              {monitoria.horario}
            </span>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Presencial · 60 minutos · até {monitoria.capacidade} alunos
          </p>
        </aside>
      </div>
    </section>
  );
}
