"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  attendanceLabels,
  attendanceSchema,
  type SessionView,
} from "@/lib/schedule";
import { useHydrated } from "@/lib/use-hydrated";
import { BookingFeedback, useBookingMutation } from "./mutation";

export function AttendanceControl({
  sessionId,
  registration,
}: {
  sessionId: string;
  registration: NonNullable<SessionView["registrations"]>[number];
}) {
  const ready = useHydrated();
  const { run, pending, error } = useBookingMutation();
  return (
    <div className="pb-4">
      <label
        className="sr-only"
        htmlFor={`attendance-${sessionId}-${registration.studentId}`}
      >
        Comparecimento de {registration.displayName}
      </label>
      <select
        id={`attendance-${sessionId}-${registration.studentId}`}
        value={registration.attendance}
        disabled={!ready || pending}
        onChange={(event) =>
          run({
            type: "attendance",
            sessionId,
            studentId: registration.studentId,
            expectedVersion: registration.version,
            attendance: attendanceSchema.parse(event.target.value),
          })
        }
        className="min-h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 sm:w-48"
      >
        {Object.entries(attendanceLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <p role="status" className="sr-only">
        {pending
          ? "Salvando comparecimento…"
          : attendanceLabels[registration.attendance]}
      </p>
      <BookingFeedback message={error} />
    </div>
  );
}

export function CompleteSession({ sessionId }: { sessionId: string }) {
  const ready = useHydrated();
  const { run, pending, error } = useBookingMutation();
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="mt-4">
      {confirm ? (
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm leading-6">
            Confirmar a realização deste encontro?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              disabled={pending}
              className="min-h-11 px-4"
              onClick={() =>
                run({ type: "complete-session", sessionId }, () =>
                  setConfirm(false),
                )
              }
            >
              {pending ? "Salvando…" : "Confirmar realização"}
            </Button>
            <Button
              variant="ghost"
              disabled={pending}
              className="min-h-11 px-4"
              onClick={() => setConfirm(false)}
            >
              Voltar
            </Button>
          </div>
        </div>
      ) : (
        <Button
          disabled={!ready || pending}
          className="min-h-11 px-4"
          onClick={() => setConfirm(true)}
        >
          Marcar como realizada
        </Button>
      )}
      <BookingFeedback message={error} />
    </div>
  );
}
