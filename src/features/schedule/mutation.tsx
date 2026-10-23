"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { BookingChange } from "@/lib/schedule";
import { submitBooking } from "./actions";

export function useBookingMutation() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const attempt = useRef<{ input: string; id: string } | null>(null);

  function run(input: BookingChange, onSuccess?: () => void) {
    if (pending) return;
    const serialized = JSON.stringify(input);
    if (attempt.current?.input !== serialized)
      attempt.current = { input: serialized, id: crypto.randomUUID() };
    const id = attempt.current.id;
    setError("");
    startTransition(async () => {
      try {
        const result = await submitBooking(input, id);
        if (!result.ok) {
          setError(result.message ?? "Não foi possível concluir a alteração.");
          return;
        }
        attempt.current = null;
        onSuccess?.();
        router.refresh();
      } catch {
        setError(
          "A conexão falhou. Tente novamente para conferir e concluir a mesma solicitação.",
        );
      }
    });
  }
  return { run, pending, error };
}

export function BookingFeedback({ message }: { message: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (message) ref.current?.focus();
  }, [message]);
  return message ? (
    <p
      ref={ref}
      tabIndex={-1}
      role="alert"
      className="mt-5 rounded-lg border border-border p-3 text-sm leading-6 focus-visible:outline-2 focus-visible:outline-ring"
    >
      {message}
    </p>
  ) : null;
}
