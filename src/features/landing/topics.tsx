"use client";

import { useState } from "react";
import { Tooltip } from "radix-ui";
import {
  ArrowRightLeft,
  Braces,
  Bug,
  Calculator,
  GitBranch,
  Grid2X2,
  Repeat2,
  SquareFunction,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { assuntos } from "@/lib/monitoria";

type Topic = (typeof assuntos)[number];
const topicIcons = {
  algoritmos: Workflow,
  "variaveis-tipos": Braces,
  "operadores-expressoes": Calculator,
  "entrada-saida": ArrowRightLeft,
  condicionais: GitBranch,
  repeticao: Repeat2,
  "vetores-matrizes": Grid2X2,
  "funcoes-procedimentos": SquareFunction,
  "teste-mesa-depuracao": Bug,
} satisfies Record<Topic["id"], LucideIcon>;

function TopicIcon({ topic, Icon }: { topic: Topic; Icon: LucideIcon }) {
  const [open, setOpen] = useState(false);
  return (
    <Tooltip.Root open={open} onOpenChange={setOpen}>
      <Tooltip.Trigger
        asChild
        onPointerDown={(event) => {
          // Let touch clicks toggle the label before Radix closes it.
          if (event.pointerType === "touch") event.preventDefault();
        }}
        onClick={(event) => {
          event.preventDefault();
          setOpen((current) => !current);
        }}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={topic.titulo}
          className={`size-14 rounded-xl ${open ? "bg-muted text-foreground" : "text-muted-foreground"}`}
        >
          <Icon aria-hidden="true" className="size-6" />
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          data-slot="topic-tooltip"
          sideOffset={8}
          collisionPadding={16}
          className="z-50 max-w-[min(18rem,calc(100vw-2rem))] rounded-lg border border-border bg-popover px-3 py-2 text-center text-sm font-medium leading-5 text-popover-foreground shadow-md"
        >
          {topic.titulo}
          <Tooltip.Arrow className="fill-popover" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export function Topics() {
  return (
    <section
      id="conteudos"
      aria-labelledby="topics-title"
      className="site-container py-12 sm:py-16"
    >
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-20">
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
        <div className="flex flex-col items-center">
          <Tooltip.Provider delayDuration={180}>
            <ul
              aria-label="Assuntos da monitoria"
              className="grid w-fit grid-cols-3 gap-4"
            >
              {assuntos.map((topic) => (
                <li key={topic.id}>
                  <TopicIcon topic={topic} Icon={topicIcons[topic.id]} />
                </li>
              ))}
            </ul>
          </Tooltip.Provider>
          <p className="mt-5 max-w-sm text-center text-xs leading-6 text-muted-foreground">
            Não sabe o nome do assunto? Escolha “Outro assunto / não sei
            classificar” ao enviar sua dúvida.
          </p>
        </div>
      </div>
    </section>
  );
}
