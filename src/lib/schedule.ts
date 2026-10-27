import { z } from "zod";
import { helpRequestSchema, type HelpRequestDraft } from "./help-request.ts";
import { monitoria } from "./monitoria.ts";

const DAY = 86_400_000;
export const SCHEDULE_END = "2026-12-11";
export const sessionIdSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Escolha uma sessão.");
const version = z.int().nonnegative();
const session = { sessionId: sessionIdSchema };
const registration = { ...session, expectedVersion: version };

export const bookingChangeSchema = z.discriminatedUnion("type", [
  z.strictObject({
    type: z.literal("book"),
    ...registration,
    helpRequest: helpRequestSchema,
  }),
  z.strictObject({
    type: z.literal("edit"),
    ...registration,
    helpRequest: helpRequestSchema,
  }),
  z.strictObject({ type: z.literal("cancel"), ...registration }),
  z.strictObject({
    type: z.literal("move"),
    ...registration,
    targetSessionId: sessionIdSchema,
  }),
  z.strictObject({
    type: z.literal("cancel-session"),
    ...session,
    reason: z.string().trim().min(1).max(500),
  }),
]);

export type BookingChange = z.infer<typeof bookingChangeSchema>;
export type RegistrationView = {
  status: "confirmed" | "cancelled";
  helpRequest: HelpRequestDraft;
  version: number;
  cancellationReason: string | null;
};
export type SessionView = {
  id: string;
  startsAt: string;
  endsAt: string;
  status: "scheduled" | "completed" | "cancelled";
  enrolledCount: number;
  cancellationReason: string | null;
  registration: RegistrationView | null;
};

export function sessionDetails(id: string) {
  if (!sessionIdSchema.safeParse(id).success || id > SCHEDULE_END) return null;
  // America/Bahia permanece UTC−03 durante todo o período aprovado de 2026.
  const start = new Date(`${id}T11:30:00-03:00`);
  if (
    !Number.isFinite(start.getTime()) ||
    start.toISOString().slice(0, 10) !== id ||
    ![1, 3].includes(start.getUTCDay())
  )
    return null;
  return {
    id,
    startsAt: start.toISOString(),
    endsAt: new Date(start.getTime() + 60 * 60_000).toISOString(),
  };
}

export function upcomingSessions(now = Date.now()) {
  const localDay = new Intl.DateTimeFormat("en-CA", {
    timeZone: monitoria.fuso,
  }).format(now);
  const firstDay = new Date(`${localDay}T00:00:00-03:00`).getTime();
  const sessions: NonNullable<ReturnType<typeof sessionDetails>>[] = [];
  for (let day = 0; day <= 28; day++) {
    const id = new Date(firstDay + day * DAY).toISOString().slice(0, 10);
    const details = sessionDetails(id);
    if (
      details &&
      Date.parse(details.startsAt) > now &&
      Date.parse(details.startsAt) < now + 28 * DAY
    )
      sessions.push(details);
  }
  return sessions;
}

export function isOpenForBooking(id: string, now = Date.now()) {
  const details = sessionDetails(id);
  return (
    !!details &&
    Date.parse(details.startsAt) > now &&
    Date.parse(details.startsAt) < now + 28 * DAY
  );
}

export function sessionLabel(id: string) {
  const details = sessionDetails(id);
  return details
    ? new Intl.DateTimeFormat("pt-BR", {
        timeZone: monitoria.fuso,
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
      }).format(new Date(details.startsAt))
    : id;
}
