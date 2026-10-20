import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { monitoria } from "@/lib/monitoria";

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
          Traz a dúvida. A gente constrói o raciocínio junto, no laboratório L7
          do SENAI Dendezeiros.
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
      <aside
        aria-label="Agenda da monitoria"
        className="rounded-2xl border border-border bg-card p-6 sm:p-8"
      >
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">PONTO DE ENCONTRO</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {monitoria.instituicao}
            </p>
          </div>
          <span
            aria-hidden="true"
            className="font-mono text-7xl leading-none font-medium tracking-[-0.1em]"
          >
            L7<span className="text-muted-foreground">.</span>
          </span>
        </div>
        <h2 className="mt-6 text-sm font-medium">{monitoria.local}</h2>
        <div className="mt-5 divide-y divide-border border-y border-border">
          {monitoria.dias.map((dia) => (
            <div
              key={dia}
              className="flex flex-wrap items-center justify-between gap-3 py-4"
            >
              <h3 className="text-sm text-muted-foreground">{dia}</h3>
              <p className="font-mono text-xs">{monitoria.horario}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-xs text-muted-foreground">
          Presencial · 60 minutos · até {monitoria.capacidade} alunos
        </p>
      </aside>
    </section>
  );
}
