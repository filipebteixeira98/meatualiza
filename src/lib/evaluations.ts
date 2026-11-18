import { z } from "zod";
import type { HelpRequestDraft } from "./help-request.ts";
import type { SessionView } from "./schedule.ts";

export const EVALUATION_COMMENT_MAX_LENGTH = 1000;
export const resolutionLabels = {
  resolved: "Resolvida",
  partial: "Parcialmente resolvida",
  unresolved: "Não resolvida",
} as const;

export const evaluationSchema = z.strictObject({
  resolution: z.enum(["resolved", "partial", "unresolved"]),
  comment: z.string().trim().max(EVALUATION_COMMENT_MAX_LENGTH).default(""),
});

export type EvaluationView = z.infer<typeof evaluationSchema> & {
  helpRequest: HelpRequestDraft;
  submittedAt: string;
};

export function summarizeEvaluations(sessions: SessionView[]) {
  const entries = sessions.flatMap((session) => {
    if (session.status !== "completed") return [];
    const registrations = session.registration
      ? session.registration.status === "confirmed"
        ? [session.registration]
        : []
      : (session.registrations ?? []);
    return registrations
      .filter(
        (registration) =>
          registration.evaluation || registration.attendance === "present",
      )
      .map((registration) => ({
        sessionId: session.id,
        startsAt: session.startsAt,
        studentId:
          "studentId" in registration ? registration.studentId : "self",
        displayName:
          "displayName" in registration ? registration.displayName : null,
        registration,
      }));
  });
  const responded = entries.filter((entry) => entry.registration.evaluation);
  return {
    pending: entries.filter((entry) => !entry.registration.evaluation),
    responded,
    results: evaluationSchema.shape.resolution.options.map((resolution) => ({
      resolution,
      label: resolutionLabels[resolution],
      count: responded.filter(
        (entry) => entry.registration.evaluation?.resolution === resolution,
      ).length,
    })),
  };
}

export type EvaluationEntry = ReturnType<
  typeof summarizeEvaluations
>["pending"][number];
