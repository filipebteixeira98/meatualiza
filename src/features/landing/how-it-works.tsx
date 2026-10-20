import { CalendarDays, MessageCircleQuestion, Sparkles } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: MessageCircleQuestion,
    title: "Comece pela sua dúvida",
    description:
      "Escolha o assunto e descreva onde está a dificuldade. Um exemplo ou o trecho do exercício ajuda a dar contexto.",
  },
  {
    number: "02",
    icon: CalendarDays,
    title: "Encontre seu horário",
    description:
      "Consulte os encontros de segunda ou quarta e escolha uma sessão com vaga para participar presencialmente.",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "Pratique e avance",
    description:
      "Trabalhe sua dúvida com o monitor. Depois do atendimento, conte se a ajuda resolveu o que você precisava.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="como-funciona"
      aria-labelledby="how-title"
      className="border-y border-border bg-card py-16 sm:py-20"
    >
      <div className="site-container">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">DO PRIMEIRO PASSO À COMPREENSÃO</p>
            <h2 id="how-title" className="section-title mt-3">
              Aprender fica mais simples
              <br className="hidden sm:block" /> quando você não está só.
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            Um encontro com espaço para suas perguntas e para construir o
            raciocínio.
          </p>
        </div>
        <ol className="mt-12 grid gap-8 md:grid-cols-3 md:gap-10">
          {steps.map((step) => (
            <li key={step.number} className="border-t border-border pt-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">
                  /{step.number}
                </span>
                <step.icon
                  className="size-5 text-muted-foreground"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </div>
              <h3 className="mt-6 text-lg font-medium tracking-tight">
                {step.title}
              </h3>
              <p className="mt-3 max-w-sm text-sm leading-7 text-muted-foreground">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
