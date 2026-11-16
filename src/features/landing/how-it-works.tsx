const steps = [
  {
    number: "01",
    title: "Comece pela sua dúvida",
    description:
      "Conte onde travou. Um exercício ou exemplo já ajuda a começar.",
  },
  {
    number: "02",
    title: "Encontre seu horário",
    description: "Escolha uma segunda ou quarta com vaga e venha ao L7.",
  },
  {
    number: "03",
    title: "Pratique e avance",
    description:
      "Pense junto com o monitor. Depois, conte se a dúvida foi resolvida.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="como-funciona"
      aria-labelledby="how-title"
      className="border-y border-border bg-muted/50 py-12 sm:py-16"
    >
      <div className="site-container">
        <h2
          id="how-title"
          className="text-2xl font-medium tracking-tight sm:text-3xl"
        >
          Você traz a dúvida. A gente pensa junto.
        </h2>
        <div className="mt-8 grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <RubiksCube />
          <ol className="grid gap-7">
            {steps.map((step) => (
              <li key={step.number} className="border-t border-border pt-6">
                <span className="font-mono text-xs text-muted-foreground">
                  /{step.number}
                </span>
                <h3 className="mt-4 text-base font-medium tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-sm text-sm leading-7 text-muted-foreground">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
import { RubiksCube } from "./rubiks-cube";
