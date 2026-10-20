import { ArrowUpRight, Braces } from "lucide-react";
import { assuntos } from "@/lib/monitoria";

export function Topics() {
  return (
    <section
      id="conteudos"
      aria-labelledby="topics-title"
      className="site-container py-16 sm:py-24"
    >
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.3fr] lg:gap-20">
        <div className="lg:sticky lg:top-10 lg:self-start">
          <p className="eyebrow">UMA BASE QUE FAZ DIFERENÇA</p>
          <h2 id="topics-title" className="section-title mt-3">
            Da primeira variável
            <br />
            ao próximo desafio.
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-7 text-muted-foreground">
            Você não precisa saber tudo para começar. A monitoria acompanha os
            fundamentos da disciplina, a partir da dificuldade que você trouxer.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-xs text-muted-foreground">
            <Braces className="size-4" aria-hidden="true" />O foco é entender o
            raciocínio.
          </div>
        </div>
        <div>
          <ul className="divide-y divide-border border-y border-border">
            {assuntos.map((assunto, index) => (
              <li
                key={assunto.titulo}
                className="flex items-start gap-4 py-5 sm:gap-5"
              >
                <span className="mt-0.5 w-5 shrink-0 font-mono text-[11px] text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-sm font-medium sm:text-base">
                    {assunto.titulo}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    {assunto.descricao}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-dashed border-border p-4 text-sm">
            <ArrowUpRight
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">
                Não sabe classificar sua dúvida?
              </span>{" "}
              Tudo bem. Escolha “Outro assunto / não sei classificar” e conte o
              que está tentando resolver.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
