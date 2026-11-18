"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  BookingFeedback,
  useBookingMutation,
} from "@/features/schedule/mutation";
import {
  evaluationSchema,
  resolutionLabels,
  EVALUATION_COMMENT_MAX_LENGTH,
} from "@/lib/evaluations";
import { useHydrated } from "@/lib/use-hydrated";

type Resolution = keyof typeof resolutionLabels;

export function EvaluationForm({
  sessionId,
  version,
}: {
  sessionId: string;
  version: number;
}) {
  const ready = useHydrated();
  const { run, pending, error } = useBookingMutation();
  const [resolution, setResolution] = useState<Resolution | "">("");
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);
  if (sent)
    return (
      <p role="status" className="mt-5 text-sm">
        Avaliação enviada.
      </p>
    );

  return (
    <form
      className="mt-6"
      aria-label="Avaliação do atendimento"
      onSubmit={(event) => {
        event.preventDefault();
        if (resolution)
          run(
            {
              type: "evaluate",
              sessionId,
              expectedVersion: version,
              evaluation: { resolution, comment },
            },
            () => setSent(true),
          );
      }}
    >
      <fieldset disabled={!ready || pending} className="min-w-0">
        <legend className="text-sm font-medium">Como ficou sua dúvida?</legend>
        <div className="mt-3 space-y-2">
          {evaluationSchema.shape.resolution.options.map((value) => (
            <label
              key={value}
              className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm has-checked:border-ring has-checked:bg-secondary has-focus-visible:ring-2 has-focus-visible:ring-ring"
            >
              <input
                type="radio"
                name={`resolution-${sessionId}`}
                value={value}
                required
                checked={resolution === value}
                onChange={() => setResolution(value)}
                className="size-4 shrink-0 accent-primary"
              />
              {resolutionLabels[value]}
            </label>
          ))}
        </div>
        <label
          htmlFor={`comment-${sessionId}`}
          className="mt-5 block text-sm font-medium"
        >
          Comentário (opcional)
        </label>
        <textarea
          id={`comment-${sessionId}`}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          maxLength={EVALUATION_COMMENT_MAX_LENGTH}
          rows={3}
          className="mt-2 block w-full resize-y rounded-lg border border-input bg-background p-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <p className="mt-2 text-xs leading-6 text-muted-foreground">
          Até 1.000 caracteres. Uma avaliação por atendimento.
        </p>
        <Button
          type="submit"
          className="mt-4 min-h-11 px-4"
          disabled={!resolution}
        >
          {pending ? "Enviando…" : "Enviar avaliação"}
        </Button>
      </fieldset>
      <BookingFeedback message={error} />
    </form>
  );
}
