import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { monitoria } from "@/lib/monitoria";

const questions = [
  {
    question: "Quem pode participar da monitoria?",
    answer:
      "A monitoria é voltada a estudantes que precisam de ajuda em Lógica de Programação. O acesso à plataforma será feito com uma conta Google, sem exigir um domínio institucional.",
  },
  {
    question: "Onde e quando acontecem os encontros?",
    answer: `Os encontros são presenciais no ${monitoria.instituicao}, ${monitoria.local}, às segundas e quartas-feiras, das ${monitoria.horario}, no fuso ${monitoria.fuso}. Cada sessão dura 60 minutos e recebe até ${monitoria.capacidade} alunos.`,
  },
  {
    question: "Como funcionará a inscrição?",
    answer: `Na plataforma, você escolherá uma sessão com vaga e informará o assunto e a descrição da dúvida. A confirmação será automática, com uma inscrição por aluno em cada sessão. A agenda mostrará as próximas quatro semanas, respeitando o término previsto para ${monitoria.termino}.`,
  },
  {
    question: "Posso cancelar ou trocar meu horário?",
    answer:
      "Sim. Inscrição, cancelamento e troca de sessão serão permitidos até o início do encontro. Se o monitor cancelar uma sessão, você poderá consultar o motivo no aplicativo.",
  },
  {
    question: "Preciso ter uma dúvida pronta para participar?",
    answer:
      "Você deverá explicar o que precisa de ajuda, mas não precisa saber o nome exato do assunto. A opção “Outro assunto / não sei classificar” permite descrever a dificuldade com suas próprias palavras.",
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
      className="border-t border-border bg-card py-16 sm:py-24"
    >
      <div className="site-container grid gap-8 lg:grid-cols-[0.8fr_1.3fr] lg:gap-20">
        <div>
          <p className="eyebrow">ANTES DO PRIMEIRO ENCONTRO</p>
          <h2 id="faq-title" className="section-title mt-3">
            Ficou alguma
            <br />
            pergunta?
          </h2>
          <p className="mt-5 max-w-xs text-sm leading-7 text-muted-foreground">
            Conheça os detalhes da monitoria e saiba o que esperar.
          </p>
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
