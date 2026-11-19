"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import Link from "next/link";
import { CircleHelp, Compass, X } from "lucide-react";
import { Dialog } from "radix-ui";
import { Button } from "@/components/ui/button";
import { MutationFeedback } from "@/features/workspace/mutation";
import type { TourStatus } from "@/lib/tour";
import { useHydrated } from "@/lib/use-hydrated";
import { recordTourDecision } from "./actions";
import { tours } from "./steps";

export function WorkspaceTour({
  role,
  initialStatus,
  mobileNavigation,
}: {
  role: keyof typeof tours;
  initialStatus: TourStatus | null;
  mobileNavigation: ReactNode;
}) {
  const ready = useHydrated();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const help = useRef<HTMLButtonElement>(null);
  const invitation = useRef<HTMLButtonElement>(null);
  const openedFromInvitation = useRef(false);
  const stepTitle = useRef<HTMLHeadingElement>(null);
  const steps = tours[role];
  const step = index === null ? null : steps[index];
  const lastStep = index === steps.length - 1;
  const showInvitation = !initialStatus && !saved;

  useEffect(() => {
    if (open && index !== null) stepTitle.current?.focus();
  }, [open, index]);

  function changeOpen(next: boolean) {
    if (next) {
      openedFromInvitation.current = false;
      setIndex(null);
      setError("");
    }
    setOpen(next);
  }

  function save(status: TourStatus) {
    setError("");
    startTransition(async () => {
      try {
        const result = await recordTourDecision(role, status);
        if (!result.ok) {
          setError(
            result.message ?? "Não foi possível salvar. Tente novamente.",
          );
          return;
        }
        setSaved(true);
        setOpen(false);
      } catch {
        setError("A conexão falhou. Tente salvar o progresso novamente.");
      }
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={changeOpen}>
      <div className="site-container flex items-center justify-between gap-2 pt-4 lg:justify-end">
        {mobileNavigation}
        <Dialog.Trigger asChild>
          <Button
            ref={help}
            variant="ghost"
            className="min-h-11 gap-2 px-3 text-muted-foreground"
            disabled={!ready}
          >
            <CircleHelp aria-hidden="true" />
            Ajuda
          </Button>
        </Dialog.Trigger>
      </div>
      {showInvitation && (
        <div className="site-container mt-4">
          <aside
            aria-label="Convite para o tour"
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3 sm:px-5"
          >
            <div className="flex items-center gap-3">
              <Compass
                aria-hidden="true"
                className="size-5 shrink-0 text-muted-foreground"
              />
              <p className="text-sm font-medium">Conheça sua área</p>
            </div>
            <Button
              ref={invitation}
              variant="outline"
              className="min-h-11"
              disabled={!ready}
              onClick={() => {
                openedFromInvitation.current = true;
                setError("");
                setIndex(0);
                setOpen(true);
              }}
            >
              Iniciar tour
            </Button>
          </aside>
        </div>
      )}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/80" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-popover p-5 text-popover-foreground shadow-xl sm:p-7"
          onOpenAutoFocus={(event) => {
            if (stepTitle.current) {
              event.preventDefault();
              stepTitle.current.focus();
            }
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const target =
              openedFromInvitation.current && invitation.current
                ? invitation.current
                : help.current;
            target?.focus();
          }}
        >
          <Dialog.Close asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 size-11"
              aria-label="Fechar ajuda"
            >
              <X aria-hidden="true" />
            </Button>
          </Dialog.Close>
          <Dialog.Title className="pr-11 text-xl font-medium tracking-tight">
            {step ? "Tour guiado" : "Ajuda"}
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-6 text-muted-foreground">
            {role === "monitor"
              ? "Recursos da área do monitor"
              : "Recursos da área do aluno"}
          </Dialog.Description>
          {step && index !== null ? (
            <>
              <div className="my-6 rounded-xl border border-border bg-card p-4 sm:p-5">
                <p
                  id="tour-progress"
                  className="font-mono text-xs text-muted-foreground"
                >
                  Passo {index + 1} de {steps.length}
                </p>
                <h2
                  ref={stepTitle}
                  tabIndex={-1}
                  aria-describedby="tour-progress"
                  className="mt-3 rounded-sm text-lg font-medium focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {step.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {step.text}
                </p>
                <Link
                  href={step.href}
                  className="mt-2 inline-flex min-h-11 items-center rounded-sm text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
                  onClick={() => setOpen(false)}
                >
                  {step.link}
                </Link>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  className="min-h-11"
                  onClick={() => save("skipped")}
                  disabled={pending}
                >
                  Pular tour
                </Button>
                <div className="flex flex-wrap gap-2">
                  {index > 0 && (
                    <Button
                      variant="outline"
                      className="min-h-11"
                      disabled={pending}
                      onClick={() => {
                        setError("");
                        setIndex(index - 1);
                      }}
                    >
                      Voltar
                    </Button>
                  )}
                  <Button
                    className="min-h-11"
                    disabled={pending}
                    onClick={() => {
                      if (lastStep) save("completed");
                      else {
                        setError("");
                        setIndex(index + 1);
                      }
                    }}
                  >
                    {lastStep ? "Concluir tour" : "Próximo"}
                  </Button>
                </div>
              </div>
              {pending && (
                <p role="status" className="mt-3 text-sm text-muted-foreground">
                  Salvando progresso…
                </p>
              )}
              <MutationFeedback message={error} />
            </>
          ) : (
            <>
              <Button
                className="mt-5 min-h-11"
                disabled={pending}
                onClick={() => setIndex(0)}
              >
                {showInvitation ? "Começar tour" : "Rever tour"}
              </Button>
              <details className="mt-5 border-t border-border pt-3">
                <summary className="flex min-h-11 cursor-pointer items-center rounded text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring">
                  Consultar guia em texto
                </summary>
                <ol className="divide-y divide-border">
                  {steps.map((item) => (
                    <li key={item.title} className="py-3 text-sm">
                      <h2 className="font-medium">{item.title}</h2>
                      <p className="mt-1 leading-6 text-muted-foreground">
                        {item.text}
                      </p>
                    </li>
                  ))}
                </ol>
              </details>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
