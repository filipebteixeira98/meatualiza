import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  CodeXml,
  MapPin,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { monitoria } from "@/lib/monitoria";

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="site-container grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:py-24"
    >
      <div>
        <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-border bg-card px-3.5 py-2 font-mono text-[10px] font-medium tracking-[0.08em] sm:text-xs">
          <span
            className="size-1.5 rounded-full bg-foreground"
            aria-hidden="true"
          />
          MONITORIA · {monitoria.disciplina.toLocaleUpperCase("pt-BR")}
        </div>
        <h1
          id="hero-title"
          className="max-w-2xl text-[clamp(2.8rem,5.4vw,5rem)] leading-[1.05] font-medium tracking-[-0.065em]"
        >
          Destrave sua lógica.
          <br />
          <span className="text-muted-foreground">
            Uma dúvida
            <br className="hidden sm:block" /> de cada vez.
          </span>
        </h1>
        <p className="mt-7 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
          Aquele exercício travou? Traga sua dúvida para a monitoria de Lógica
          de Programação e construa o próximo passo com ajuda.
        </p>
        <div className="mt-8 flex flex-col gap-3 min-[400px]:flex-row">
          <Button asChild size="lg" className="h-12 rounded-xl px-6">
            <Link href="/entrar">
              Acessar plataforma <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="lg"
            className="h-12 rounded-xl px-5"
          >
            <Link href="#como-funciona">
              Como funciona <ArrowDown aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
          <Users className="size-3.5" aria-hidden="true" />
          Encontros presenciais em grupos de até {monitoria.capacidade} alunos.
        </p>
      </div>
      <div className="relative mx-auto w-full max-w-lg lg:ml-auto">
        <div className="absolute -top-4 right-5 z-10 flex rotate-3 items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-xs font-medium shadow-sm sm:right-7">
          <CodeXml className="size-4" aria-hidden="true" />
          Todo aprendizado começa com uma pergunta.
        </div>
        <div className="schedule-surface relative overflow-hidden rounded-[1.75rem] border border-border bg-primary p-6 text-primary-foreground shadow-xl shadow-foreground/5 sm:p-8">
          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] tracking-[0.18em] text-primary-foreground/60">
                  RESERVE UM TEMPO PARA APRENDER
                </p>
                <h2 className="mt-3 text-2xl font-medium tracking-tight sm:text-3xl">
                  Seu ponto de encontro.
                </h2>
              </div>
              <CalendarDays
                className="mt-1 size-6 shrink-0 text-primary-foreground/60"
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </div>
            <div className="mt-8 space-y-3">
              {monitoria.dias.map((dia, index) => (
                <div
                  key={dia}
                  className="flex items-center gap-4 rounded-xl border border-primary-foreground/15 bg-primary-foreground/5 p-4"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary-foreground text-sm font-semibold text-primary">
                    {index === 0 ? "SEG" : "QUA"}
                  </span>
                  <div>
                    <h3 className="text-sm font-medium">{dia}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-primary-foreground/65">
                      <Clock3 className="size-3" aria-hidden="true" />
                      {monitoria.horario}
                    </p>
                  </div>
                  <span className="ml-auto hidden text-xs text-primary-foreground/60 min-[375px]:block">
                    60 min
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-start gap-3 border-t border-primary-foreground/15 pt-6">
              <MapPin
                className="mt-0.5 size-4 shrink-0 text-primary-foreground/60"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-medium">{monitoria.instituicao}</p>
                <p className="mt-1 text-xs text-primary-foreground/65">
                  {monitoria.local}
                </p>
              </div>
            </div>
            <div className="mt-7 flex flex-wrap justify-between gap-2 font-mono text-[10px] text-primary-foreground/50">
              <span>{monitoria.fuso}</span>
              <span>Até {monitoria.termino}</span>
            </div>
          </div>
        </div>
        <p className="mt-4 text-center font-mono text-[10px] tracking-wide text-muted-foreground">
          MENOS RECEIO DE PERGUNTAR. MAIS ESPAÇO PARA ENTENDER.
        </p>
      </div>
    </section>
  );
}
