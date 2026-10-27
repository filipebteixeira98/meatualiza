"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, PencilLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/lib/use-hydrated";
import {
  HELP_DESCRIPTION_MAX_LENGTH,
  helpRequestSchema,
  helpRequestTopics,
} from "@/lib/help-request";
import {
  sessionIdSchema,
  sessionLabel,
  type SessionView,
} from "@/lib/schedule";
import { monitoria } from "@/lib/monitoria";
import {
  BookingFeedback,
  useBookingMutation,
} from "@/features/schedule/mutation";
import type { z } from "zod";

const formSchema = helpRequestSchema.extend({ sessionId: sessionIdSchema });
type BookingDraft = z.infer<typeof formSchema>;

export function HelpRequestForm({
  sessions,
  initialSessionId,
}: {
  sessions: SessionView[];
  initialSessionId?: string;
}) {
  const router = useRouter();
  const initial = sessions.find(({ id }) => id === initialSessionId);
  const editing = initial?.registration?.status === "confirmed";
  const { run, pending, error } = useBookingMutation();
  const available = sessions.filter(
    (session) =>
      session.status === "scheduled" &&
      (editing
        ? session.id === initialSessionId
        : session.enrolledCount < monitoria.capacidade &&
          session.registration?.status !== "confirmed"),
  );
  const ready = useHydrated();
  const [draft, setDraft] = useState<BookingDraft | null>(null);
  const reviewHeading = useRef<HTMLHeadingElement>(null);
  const {
    register,
    handleSubmit,
    control,
    setFocus,
    formState: { errors, isSubmitSuccessful },
  } = useForm<BookingDraft>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...(editing ? initial.registration!.helpRequest : { description: "" }),
      sessionId: initialSessionId ?? "",
    },
  });
  const description = useWatch({ control, name: "description" });

  useEffect(() => {
    if (draft) reviewHeading.current?.focus();
    else if (isSubmitSuccessful) setFocus("description");
  }, [draft, isSubmitSuccessful, setFocus]);

  return (
    <section
      aria-label="Pedido de ajuda e inscrição"
      className="mt-9 rounded-2xl border border-border bg-card p-5 sm:p-8"
    >
      {draft ? (
        <div>
          <h2
            ref={reviewHeading}
            tabIndex={-1}
            className="text-2xl font-medium tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Confira sua dúvida.
          </h2>
          <dl className="mt-7 space-y-6">
            <div>
              <dt className="eyebrow">SESSÃO</dt>
              <dd className="mt-2 text-base capitalize">
                {sessionLabel(draft.sessionId)} · {monitoria.horario}
              </dd>
            </div>
            <div>
              <dt className="eyebrow">ASSUNTO</dt>
              <dd className="mt-2 text-base">
                {
                  helpRequestTopics.find((topic) => topic.id === draft.topicId)
                    ?.titulo
                }
              </dd>
            </div>
            <div>
              <dt className="eyebrow">SUA DÚVIDA</dt>
              <dd className="mt-2 text-base leading-7 whitespace-pre-wrap [overflow-wrap:anywhere]">
                {draft.description}
              </dd>
            </div>
          </dl>
          <p className="mt-7 border-t border-border pt-6 text-sm leading-6 text-muted-foreground">
            {editing
              ? "Sua inscrição já está confirmada. Ao salvar, somente a dúvida será atualizada."
              : "Sua inscrição só será confirmada ao concluir esta etapa."}{" "}
            O encontro é presencial no {monitoria.instituicao},{" "}
            {monitoria.local}. Alterações e cancelamento são permitidos até o
            início.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              type="button"
              disabled={!ready || pending}
              className="min-h-11 px-4"
              onClick={() => {
                const { sessionId, ...helpRequest } = draft;
                const selected = sessions.find(({ id }) => id === sessionId);
                run(
                  {
                    type: editing ? "edit" : "book",
                    sessionId,
                    expectedVersion: selected?.registration?.version ?? 0,
                    helpRequest,
                  },
                  () => router.push("/aluno/agenda"),
                );
              }}
            >
              {pending
                ? "Confirmando…"
                : editing
                  ? "Salvar dúvida"
                  : "Confirmar inscrição"}
            </Button>
            <Button
              type="button"
              disabled={pending}
              variant="outline"
              className="min-h-11 px-4"
              onClick={() => setDraft(null)}
            >
              <PencilLine aria-hidden="true" />
              Editar dúvida
            </Button>
          </div>
          <BookingFeedback message={error} />
        </div>
      ) : (
        <form noValidate onSubmit={handleSubmit(setDraft)}>
          <fieldset disabled={!ready || pending} className="min-w-0">
            <div className="mb-7">
              <label htmlFor="sessionId" className="text-sm font-medium">
                Sessão de monitoria
              </label>
              <p
                id="session-hint"
                className="mt-2 text-sm leading-6 text-muted-foreground"
              >
                {editing
                  ? "Sua vaga já está confirmada. A edição não ocupa outra vaga."
                  : `${monitoria.horario} · America/Bahia · até dez alunos. A vaga é conferida ao confirmar.`}
              </p>
              <select
                id="sessionId"
                aria-required="true"
                aria-invalid={!!errors.sessionId}
                aria-describedby={`session-hint${errors.sessionId ? " session-error" : ""}`}
                className="mt-3 min-h-12 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive"
                {...register("sessionId")}
              >
                <option value="">Escolha uma sessão</option>
                {available.map((session) => (
                  <option key={session.id} value={session.id}>
                    {sessionLabel(session.id)} ·{" "}
                    {monitoria.capacidade - session.enrolledCount} vagas
                  </option>
                ))}
              </select>
              {errors.sessionId && (
                <p
                  id="session-error"
                  role="alert"
                  className="mt-2 text-sm text-destructive"
                >
                  {errors.sessionId.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="topicId" className="text-sm font-medium">
                Assunto
              </label>
              <p
                id="topic-hint"
                className="mt-2 text-sm leading-6 text-muted-foreground"
              >
                Não sabe classificar? Escolha a última opção.
              </p>
              <select
                id="topicId"
                defaultValue=""
                aria-required="true"
                aria-invalid={!!errors.topicId}
                aria-describedby={`topic-hint${errors.topicId ? " topic-error" : ""}`}
                className="mt-3 min-h-12 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive"
                {...register("topicId")}
              >
                <option value="" disabled>
                  Selecione um assunto
                </option>
                {helpRequestTopics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.titulo}
                  </option>
                ))}
              </select>
              {errors.topicId && (
                <p
                  id="topic-error"
                  role="alert"
                  className="mt-2 text-sm text-destructive"
                >
                  {errors.topicId.message}
                </p>
              )}
            </div>
            <div className="mt-7">
              <label htmlFor="description" className="text-sm font-medium">
                Sua dúvida
              </label>
              <p
                id="description-hint"
                className="mt-2 text-sm leading-6 text-muted-foreground"
              >
                Conte o que tentou e em qual ponto precisa de ajuda.
              </p>
              <textarea
                id="description"
                rows={6}
                maxLength={HELP_DESCRIPTION_MAX_LENGTH}
                aria-required="true"
                aria-invalid={!!errors.description}
                aria-describedby={`description-hint description-count${errors.description ? " description-error" : ""}`}
                placeholder="Ex.: meu laço não termina. Tentei alterar o contador, mas não entendi a condição de parada."
                className="mt-3 block w-full min-w-0 resize-y rounded-lg border border-input bg-background p-3 text-base leading-7 outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive"
                {...register("description")}
              />
              <p
                id="description-count"
                className="mt-2 text-right font-mono text-xs text-muted-foreground"
              >
                {description.length} / {HELP_DESCRIPTION_MAX_LENGTH} caracteres
              </p>
              {errors.description && (
                <p
                  id="description-error"
                  role="alert"
                  className="mt-2 text-sm text-destructive"
                >
                  {errors.description.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="mt-7 min-h-11 w-full px-4 sm:w-auto"
            >
              Revisar dúvida
              <ArrowRight aria-hidden="true" />
            </Button>
          </fieldset>
        </form>
      )}
      <p className="mt-6 text-xs leading-6 text-muted-foreground">
        Antes de confirmar, as alterações ficam só nesta página. Ao sair ou
        atualizar, o texto ainda não enviado é descartado.
      </p>
    </section>
  );
}
