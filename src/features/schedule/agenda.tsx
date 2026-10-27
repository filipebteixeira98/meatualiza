"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { monitoria } from "@/lib/monitoria";
import { sessionLabel, type SessionView } from "@/lib/schedule";
import { helpRequestTopics } from "@/lib/help-request";
import { useHydrated } from "@/lib/use-hydrated";
import { BookingFeedback, useBookingMutation } from "./mutation";

function RegistrationActions({
  session,
  sessions,
  onMove,
}: {
  session: SessionView;
  sessions: SessionView[];
  onMove: (id: string) => void;
}) {
  const ready = useHydrated();
  const { run, pending, error } = useBookingMutation();
  const [cancel, setCancel] = useState(false);
  const [target, setTarget] = useState("");
  const registration = session.registration!;
  const targets = sessions.filter(
    (other) =>
      other.id !== session.id &&
      other.status === "scheduled" &&
      other.enrolledCount < monitoria.capacidade &&
      other.registration?.status !== "confirmed",
  );
  return (
    <div className="mt-5">
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline" className="min-h-11 px-4">
          <Link href={`/aluno/duvida?sessao=${session.id}`}>Editar dúvida</Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={!ready || pending}
          className="min-h-11 px-4"
          onClick={() => setCancel(!cancel)}
        >
          Cancelar inscrição
        </Button>
      </div>
      {cancel && (
        <div className="mt-4 rounded-lg border border-border p-4">
          <p className="text-sm leading-6">
            Cancelar sua inscrição nesta sessão? A vaga será liberada para outro
            aluno.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              disabled={pending}
              className="min-h-11 px-4"
              onClick={() =>
                run(
                  {
                    type: "cancel",
                    sessionId: session.id,
                    expectedVersion: registration.version,
                  },
                  () => setCancel(false),
                )
              }
            >
              Confirmar cancelamento
            </Button>
            <Button
              variant="ghost"
              disabled={pending}
              className="min-h-11"
              onClick={() => setCancel(false)}
            >
              Manter inscrição
            </Button>
          </div>
        </div>
      )}
      <form
        className="mt-5 border-t border-border pt-5"
        onSubmit={(event) => {
          event.preventDefault();
          run(
            {
              type: "move",
              sessionId: session.id,
              targetSessionId: target,
              expectedVersion: registration.version,
            },
            () => {
              onMove(target);
              setTarget("");
            },
          );
        }}
      >
        <fieldset
          disabled={!ready || pending || !targets.length}
          className="min-w-0"
        >
          <label htmlFor={`move-${session.id}`} className="text-sm font-medium">
            Trocar sessão
          </label>
          <p className="mt-2 text-xs leading-6 text-muted-foreground">
            Sua vaga atual permanece até a confirmação da troca.
          </p>
          <select
            id={`move-${session.id}`}
            required
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            className="mt-3 min-h-12 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">
              {targets.length
                ? "Escolha nova sessão"
                : "Nenhuma outra sessão com vaga"}
            </option>
            {targets.map((other) => (
              <option key={other.id} value={other.id}>
                {sessionLabel(other.id)} ·{" "}
                {monitoria.capacidade - other.enrolledCount} vagas
              </option>
            ))}
          </select>
          <Button
            type="submit"
            variant="outline"
            disabled={!target}
            className="mt-3 min-h-11 px-4"
          >
            {pending ? "Confirmando…" : "Confirmar troca"}
          </Button>
        </fieldset>
      </form>
      <BookingFeedback message={error} />
    </div>
  );
}

function CancelSession({ session }: { session: SessionView }) {
  const ready = useHydrated();
  const { run, pending, error } = useBookingMutation();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  return (
    <div className="mt-5">
      <Button
        variant="outline"
        className="min-h-11 px-4"
        disabled={!ready || pending}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        {session.enrolledCount ? "Cancelar sessão" : "Bloquear data"}
      </Button>
      {open && (
        <form
          className="mt-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (reason.trim())
              run(
                { type: "cancel-session", sessionId: session.id, reason },
                () => {
                  setOpen(false);
                  setReason("");
                },
              );
          }}
        >
          <fieldset disabled={pending} className="min-w-0">
            <label
              htmlFor={`reason-${session.id}`}
              className="text-sm font-medium"
            >
              Motivo do cancelamento
            </label>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              As inscrições serão canceladas. Os alunos verão este motivo no
              aplicativo.
            </p>
            <textarea
              id={`reason-${session.id}`}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              required
              maxLength={500}
              rows={3}
              className="mt-3 block w-full resize-y rounded-lg border border-input bg-background p-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button
              type="submit"
              disabled={!reason.trim()}
              className="mt-3 h-auto min-h-11 w-full px-4 whitespace-normal"
            >
              {pending ? "Cancelando…" : "Confirmar cancelamento da sessão"}
            </Button>
          </fieldset>
        </form>
      )}
      <BookingFeedback message={error} />
    </div>
  );
}

function SessionCard({
  session,
  sessions,
  monitor,
  onMove,
}: {
  session: SessionView;
  sessions: SessionView[];
  monitor: boolean;
  onMove: (id: string) => void;
}) {
  const active = session.registration?.status === "confirmed";
  return (
    <article
      aria-label={`Sessão de ${sessionLabel(session.id)}`}
      className="rounded-2xl border border-border bg-card p-5 sm:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-medium capitalize">
            {sessionLabel(session.id)}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {monitoria.horario} · {monitoria.local}
          </p>
        </div>
        <p className="rounded-lg bg-secondary px-3 py-2 font-mono text-xs">
          {session.enrolledCount}/{monitoria.capacidade} inscritos
        </p>
      </div>
      {session.status === "cancelled" ? (
        <p className="mt-5 text-sm leading-7 [overflow-wrap:anywhere]">
          <strong>Sessão cancelada.</strong> {session.cancellationReason}
        </p>
      ) : session.status === "completed" ? (
        <p className="mt-5 text-sm">Sessão realizada.</p>
      ) : (
        <>
          {active ? (
            <div className="mt-5">
              <p className="text-sm font-medium">
                Sua inscrição está confirmada.
              </p>
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer py-2 focus-visible:outline-2 focus-visible:outline-ring">
                  Ver minha dúvida
                </summary>
                <p className="mt-3 text-muted-foreground">
                  {
                    helpRequestTopics.find(
                      ({ id }) =>
                        id === session.registration?.helpRequest.topicId,
                    )?.titulo
                  }
                </p>
                <p className="mt-2 leading-7 whitespace-pre-wrap [overflow-wrap:anywhere]">
                  {session.registration?.helpRequest.description}
                </p>
              </details>
              <RegistrationActions
                session={session}
                sessions={sessions}
                onMove={onMove}
              />
            </div>
          ) : monitor ? (
            <CancelSession session={session} />
          ) : (
            <div className="mt-5">
              {session.registration?.status === "cancelled" && (
                <p className="mb-4 text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere]">
                  Inscrição cancelada. {session.registration.cancellationReason}
                </p>
              )}
              {session.enrolledCount < monitoria.capacidade ? (
                <Button asChild className="min-h-11 px-4">
                  <Link href={`/aluno/duvida?sessao=${session.id}`}>
                    Inscrever-se
                  </Link>
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sessão lotada. Escolha outro encontro.
                </p>
              )}
            </div>
          )}
        </>
      )}
      {monitor && session.status === "scheduled" && (
        <p className="mt-4 text-xs leading-6 text-muted-foreground">
          Quantidade prevista de alunos; o comparecimento será registrado
          separadamente.
        </p>
      )}
    </article>
  );
}

export function Agenda({
  sessions,
  monitor = false,
}: {
  sessions: SessionView[];
  monitor?: boolean;
}) {
  const router = useRouter();
  const ready = useHydrated();
  const [refreshing, refresh] = useTransition();
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [selected, setSelected] = useState(
    sessions.find((session) => session.registration?.status === "confirmed")
      ?.id ??
      sessions.find(
        (session) =>
          session.status === "cancelled" &&
          session.registration?.status === "cancelled",
      )?.id ??
      sessions[0]?.id ??
      "",
  );
  const months = [...new Set(sessions.map(({ id }) => id.slice(0, 7)))];
  const [month, setMonth] = useState(selected.slice(0, 7));
  const visibleMonth = months.includes(month) ? month : (months[0] ?? "");
  const select = (id: string) => {
    setSelected(id);
    setMonth(id.slice(0, 7));
  };
  const first = new Date(`${visibleMonth}-01T12:00:00Z`);
  const lastDay = Number.isNaN(first.getTime())
    ? 0
    : new Date(
        Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
      ).getUTCDate();
  const leading = (first.getUTCDay() + 6) % 7;
  const cells = Array.from(
    { length: Math.ceil((leading + lastDay) / 7) * 7 },
    (_, index) => index - leading + 1,
  );
  const current = sessions.find(({ id }) => id === selected);
  return (
    <section className="mt-8" aria-label="Agenda de monitoria">
      {!monitor &&
        sessions
          .filter(
            (session) =>
              session.status === "cancelled" &&
              session.registration?.status === "cancelled" &&
              session.id !== selected,
          )
          .map((session) => (
            <div
              key={session.id}
              role="status"
              className="mb-5 rounded-xl border border-border bg-card p-4 text-sm leading-7 [overflow-wrap:anywhere]"
            >
              <p>
                <strong>
                  Sua sessão de {sessionLabel(session.id)} foi cancelada.
                </strong>{" "}
                {session.cancellationReason}
              </p>
              <Button
                variant="link"
                className="mt-2 h-auto min-h-11 px-0 whitespace-normal"
                onClick={() => select(session.id)}
              >
                Ver sessão cancelada
              </Button>
            </div>
          ))}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div aria-label="Visualização da agenda" className="flex gap-2">
          <Button
            variant={view === "calendar" ? "secondary" : "ghost"}
            aria-pressed={view === "calendar"}
            className="min-h-11 px-4"
            disabled={!ready}
            onClick={() => setView("calendar")}
          >
            Calendário
          </Button>
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            aria-pressed={view === "list"}
            className="min-h-11 px-4"
            disabled={!ready}
            onClick={() => setView("list")}
          >
            Lista
          </Button>
        </div>
        <Button
          variant="ghost"
          className="min-h-11"
          disabled={!ready || refreshing}
          onClick={() => refresh(() => router.refresh())}
        >
          <RefreshCw
            aria-hidden="true"
            className={refreshing ? "animate-spin" : ""}
          />
          {refreshing ? "Atualizando…" : "Atualizar agenda"}
        </Button>
      </div>
      {!sessions.length ? (
        <p
          role="status"
          className="rounded-2xl border border-border p-6 text-sm leading-7 text-muted-foreground"
        >
          Não há sessões futuras disponíveis no período da monitoria, que
          termina em {monitoria.termino}.
        </p>
      ) : view === "list" ? (
        <div className="space-y-5">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              sessions={sessions}
              monitor={monitor}
              onMove={select}
            />
          ))}
        </div>
      ) : (
        <>
          <div className="mb-6 rounded-2xl border border-border p-3 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="size-11"
                aria-label="Mês anterior"
                disabled={!ready || months.indexOf(visibleMonth) <= 0}
                onClick={() =>
                  setMonth(months[months.indexOf(visibleMonth) - 1])
                }
              >
                <ChevronLeft aria-hidden="true" />
              </Button>
              <p className="text-sm font-medium capitalize" aria-live="polite">
                {new Intl.DateTimeFormat("pt-BR", {
                  month: "long",
                  year: "numeric",
                  timeZone: monitoria.fuso,
                }).format(first)}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="size-11"
                aria-label="Próximo mês"
                disabled={
                  !ready || months.indexOf(visibleMonth) >= months.length - 1
                }
                onClick={() =>
                  setMonth(months[months.indexOf(visibleMonth) + 1])
                }
              >
                <ChevronRight aria-hidden="true" />
              </Button>
            </div>
            <table className="w-full table-fixed border-collapse text-center text-sm">
              <caption className="sr-only">
                Sessões de monitoria. Selecione um dia para ver vagas e
                detalhes.
              </caption>
              <thead>
                <tr>
                  {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map(
                    (day) => (
                      <th
                        key={day}
                        scope="col"
                        className="pb-3 font-normal text-muted-foreground"
                      >
                        {day}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: cells.length / 7 }, (_, row) => (
                  <tr key={row}>
                    {cells.slice(row * 7, row * 7 + 7).map((day, column) => {
                      const id = `${visibleMonth}-${String(day).padStart(2, "0")}`;
                      const slot = sessions.find(
                        (session) => session.id === id,
                      );
                      return (
                        <td key={column} className="py-1 align-top">
                          {day < 1 || day > lastDay ? null : slot ? (
                            <button
                              type="button"
                              disabled={!ready}
                              aria-pressed={selected === id}
                              aria-label={`${sessionLabel(id)} — ${slot.status === "cancelled" ? "cancelada" : `${slot.enrolledCount} de ${monitoria.capacidade} inscritos`}`}
                              onClick={() => select(id)}
                              className={`min-h-12 w-full rounded-lg border border-border px-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected === id ? "bg-primary text-primary-foreground" : "bg-card hover:bg-secondary"}`}
                            >
                              <span
                                className={
                                  slot.status === "cancelled"
                                    ? "line-through"
                                    : ""
                                }
                              >
                                {day}
                              </span>
                              <span
                                aria-hidden="true"
                                className="mt-0.5 block font-mono text-[9px]"
                              >
                                {slot.status === "cancelled"
                                  ? "×"
                                  : slot.registration?.status === "confirmed"
                                    ? "✓"
                                    : `${monitoria.capacidade - slot.enrolledCount}v`}
                              </span>
                            </button>
                          ) : (
                            <span className="block py-3 text-muted-foreground/60">
                              {day}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 text-xs leading-6 text-muted-foreground">
              v = vagas · ✓ = sua inscrição · × = sessão cancelada
            </p>
          </div>
          {current && (
            <SessionCard
              key={current.id}
              session={current}
              sessions={sessions}
              monitor={monitor}
              onMove={select}
            />
          )}
        </>
      )}
    </section>
  );
}
