"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, PencilLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/lib/use-hydrated";
import {
  HELP_DESCRIPTION_MAX_LENGTH,
  helpRequestSchema,
  helpRequestTopics,
  type HelpRequestDraft,
} from "@/lib/help-request";

export function HelpRequestForm() {
  const ready = useHydrated();
  const [draft, setDraft] = useState<HelpRequestDraft | null>(null);
  const reviewHeading = useRef<HTMLHeadingElement>(null);
  const {
    register,
    handleSubmit,
    control,
    setFocus,
    formState: { errors, isSubmitSuccessful },
  } = useForm<HelpRequestDraft>({
    resolver: zodResolver(helpRequestSchema),
    defaultValues: { description: "" },
  });
  const description = useWatch({ control, name: "description" });

  useEffect(() => {
    if (draft) reviewHeading.current?.focus();
    else if (isSubmitSuccessful) setFocus("description");
  }, [draft, isSubmitSuccessful, setFocus]);

  return (
    <section
      aria-label="Preparação da dúvida"
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
            Este rascunho ainda não foi enviado. A escolha da sessão e a
            inscrição serão disponibilizadas na próxima etapa.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-6 min-h-11 px-4"
            onClick={() => setDraft(null)}
          >
            <PencilLine aria-hidden="true" />
            Editar dúvida
          </Button>
        </div>
      ) : (
        <form noValidate onSubmit={handleSubmit(setDraft)}>
          <fieldset disabled={!ready}>
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
        O rascunho fica apenas nesta página e será perdido ao sair ou atualizar.
      </p>
    </section>
  );
}
