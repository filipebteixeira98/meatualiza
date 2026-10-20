import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { assuntos } from "@/lib/monitoria";

export function Topics() {
  return (
    <section
      id="conteudos"
      aria-labelledby="topics-title"
      className="site-container py-12 sm:py-16"
    >
      <div className="grid gap-5 lg:grid-cols-2 lg:gap-20">
        <div>
          <p className="eyebrow">QUAL LINHA TE TRAVOU?</p>
          <h2
            id="topics-title"
            className="mt-3 text-2xl font-medium tracking-tight sm:text-3xl"
          >
            Dos algoritmos à depuração.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">
            Variáveis, decisões, laços e funções. O ponto de partida é a dúvida
            que você trouxer.
          </p>
        </div>
        <div>
          <Accordion type="single" collapsible>
            <AccordionItem value="assuntos" className="border-y border-border">
              <AccordionTrigger className="min-h-14 text-sm hover:no-underline">
                Explorar os {assuntos.length} assuntos
              </AccordionTrigger>
              <AccordionContent>
                <ul className="grid gap-x-5 gap-y-3 pt-2 pb-1 text-sm text-muted-foreground sm:grid-cols-2">
                  {assuntos.map((assunto) => (
                    <li key={assunto.titulo}>{assunto.titulo}</li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <p className="mt-4 text-xs leading-6 text-muted-foreground">
            Não sabe o nome do assunto? Escolha “Outro assunto / não sei
            classificar” ao enviar sua dúvida.
          </p>
        </div>
      </div>
    </section>
  );
}
