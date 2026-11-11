import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowUpRight, CalendarDays, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { getAgenda } from "@/lib/bookings";
import { helpRequestTopics } from "@/lib/help-request";
import { monitoria } from "@/lib/monitoria";
import { sessionLabel } from "@/lib/schedule";

export const metadata: Metadata = {
  title: "Sua área de monitoria",
  robots: { index: false, follow: false },
};

export default async function StudentPage() {
  const agenda = await getAgenda((await cookies()).get(SESSION_COOKIE)?.value);
  if (!agenda) redirect("/entrar");
  if (agenda.role === "monitor") redirect("/monitor");
  const upcoming = agenda.sessions.filter(
    (session) =>
      session.status === "scheduled" &&
      session.registration?.status === "confirmed",
  );
  const cancelled = agenda.sessions.filter(
    (session) => session.registration?.status === "cancelled",
  );
  const canBook = agenda.sessions.some(
    (session) =>
      session.status === "scheduled" &&
      session.enrolledCount < monitoria.capacidade &&
      session.registration?.status !== "confirmed",
  );

  return (
    <main
      id="conteudo"
      tabIndex={-1}
      className="site-container flex-1 py-10 sm:py-16"
    >
      <div className="mx-auto max-w-4xl">
        <p className="eyebrow">SEU PAINEL / L7</p>
        <h1 className="mt-4 text-4xl font-medium tracking-tight sm:text-5xl">
          Seu ponto de partida.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
          Acompanhe suas inscrições e as dúvidas que você quer trabalhar nos
          próximos encontros.
        </p>
        {canBook && (
          <Button asChild className="mt-6 min-h-11 px-4">
            <Link href="/aluno/duvida">
              <Plus aria-hidden="true" />
              Preparar minha dúvida
            </Link>
          </Button>
        )}
        <section aria-labelledby="upcoming-title" className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="upcoming-title" className="text-xl font-medium">
              Próximas monitorias
            </h2>
            <p className="rounded-lg bg-secondary px-3 py-2 font-mono text-xs">
              Confirmadas: {upcoming.length}
            </p>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Próximas quatro semanas · horários em {monitoria.fuso}.
          </p>
          {upcoming.length ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {upcoming.map((session) => {
                const registration = session.registration!;
                return (
                  <article
                    key={session.id}
                    aria-label={`Inscrição de ${sessionLabel(session.id)}`}
                    className="min-w-0 rounded-2xl border border-border bg-card p-6"
                  >
                    <p className="eyebrow">INSCRIÇÃO CONFIRMADA</p>
                    <h3 className="mt-3 text-xl font-medium">
                      <time dateTime={session.startsAt}>
                        {sessionLabel(session.id)}
                      </time>
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {monitoria.horario} · {monitoria.local}
                    </p>
                    <p className="mt-5 text-sm font-medium">
                      {
                        helpRequestTopics.find(
                          ({ id }) => id === registration.helpRequest.topicId,
                        )?.titulo
                      }
                    </p>
                    <details className="mt-2 text-sm">
                      <summary className="cursor-pointer py-2 text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring">
                        Ver minha dúvida
                      </summary>
                      <p className="mt-2 leading-7 whitespace-pre-wrap [overflow-wrap:anywhere]">
                        {registration.helpRequest.description}
                      </p>
                    </details>
                    <Button
                      asChild
                      variant="outline"
                      className="mt-5 min-h-11 w-full px-3"
                    >
                      <Link href={`/aluno/agenda?sessao=${session.id}`}>
                        Abrir inscrição
                        <ArrowUpRight aria-hidden="true" />
                      </Link>
                    </Button>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-border p-7 sm:p-9">
              <CalendarDays
                className="size-7 text-muted-foreground"
                aria-hidden="true"
              />
              <h3 className="mt-4 text-lg font-medium">
                Nenhuma inscrição confirmada.
              </h3>
              <p className="mt-3 max-w-lg text-sm leading-7 text-muted-foreground">
                {agenda.sessions.length
                  ? "Consulte a agenda para encontrar uma sessão. Sua dúvida será salva junto à inscrição."
                  : "Não há novas sessões no período da monitoria. Consulte a agenda para conferir a disponibilidade."}
              </p>
              <Button asChild variant="outline" className="mt-5 min-h-11 px-4">
                <Link href="/aluno/agenda">Ver sessões na agenda</Link>
              </Button>
            </div>
          )}
        </section>
        {cancelled.length > 0 && (
          <section aria-labelledby="cancelled-title" className="mt-10">
            <h2 id="cancelled-title" className="text-xl font-medium">
              Inscrições canceladas
            </h2>
            <div className="mt-5 space-y-4">
              {cancelled.map((session) => (
                <article
                  key={session.id}
                  aria-label={`Cancelamento de ${sessionLabel(session.id)}`}
                  className="rounded-2xl border border-border p-6"
                >
                  <h3 className="font-medium">
                    {sessionLabel(session.id)} ·{" "}
                    {session.status === "cancelled"
                      ? "Sessão cancelada"
                      : "Inscrição cancelada"}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground [overflow-wrap:anywhere]">
                    {session.registration?.cancellationReason ??
                      session.cancellationReason ??
                      "Cancelamento registrado."}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}
        <p className="mt-10 border-t border-border pt-6 text-sm leading-7 text-muted-foreground">
          {monitoria.instituicao} · {monitoria.local}. Atendimento presencial em
          grupo, às segundas e quartas, {monitoria.horario}.
        </p>
      </div>
    </main>
  );
}
