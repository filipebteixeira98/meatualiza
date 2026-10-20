import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { monitoria } from "@/lib/monitoria";

const questions = [
  {
    question: "Onde e quando acontecem os encontros?",
    answer: `Os encontros são presenciais no ${monitoria.instituicao}, ${monitoria.local}, às segundas e quartas-feiras, no horário ${monitoria.horario}, fuso ${monitoria.fuso}. Cada sessão dura 60 minutos e recebe até ${monitoria.capacidade} alunos.`,
  },
  {
    question: "Como funcionará a inscrição?",
    answer: `Você entrará com uma conta Google, escolherá uma sessão com vaga e descreverá sua dúvida. A confirmação será automática, com uma inscrição por aluno e sessão. A agenda mostrará as próximas quatro semanas, até o término previsto em ${monitoria.termino}.`,
  },
  {
    question: "Posso cancelar ou trocar meu horário?",
    answer:
      "Sim. Inscrição, cancelamento e troca de sessão serão permitidos até o início do encontro. Se o monitor cancelar uma sessão, você poderá consultar o motivo no aplicativo.",
  },
  {
    question: "O que acontece depois do atendimento?",
    answer:
      "Após a realização da sessão e o registro da sua presença, você poderá informar se a dúvida foi resolvida, parcialmente resolvida ou não resolvida, com um comentário opcional. Uma avaliação pendente não impedirá novos agendamentos.",
  },
];

export function Faq() {
  return (
    <section
      id="perguntas"
      aria-labelledby="faq-title"
      className="border-t border-border py-12 sm:py-16"
    >
      <div className="site-container grid gap-8 lg:grid-cols-[0.8fr_1.3fr] lg:gap-20">
        <div>
          <h2
            id="faq-title"
            className="text-2xl font-medium tracking-tight sm:text-3xl"
          >
            Antes de vir ao L7.
          </h2>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {questions.map((item, index) => (
            <AccordionItem key={item.question} value={`question-${index}`}>
              <AccordionTrigger className="py-5 text-left text-sm font-medium hover:no-underline sm:text-base">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="pr-6 pb-5 text-sm leading-7 text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
