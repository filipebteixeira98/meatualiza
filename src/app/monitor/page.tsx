import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowUpRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { getAgenda } from "@/lib/bookings";
import { summarizeMonitorSessions } from "@/lib/monitor-dashboard";
import { monitoria } from "@/lib/monitoria";
import { sessionLabel } from "@/lib/schedule";

export const metadata: Metadata = {
  title: "Sua área de monitor",
  robots: { index: false, follow: false },
};

export default async function MonitorPage() {
  const agenda = await getAgenda(
    (await cookies()).get(SESSION_COOKIE)?.value,
    undefined,
    true,
  );
  if (!agenda) redirect("/entrar");
  if (agenda.role !== "monitor") redirect("/aluno");
  const summary = summarizeMonitorSessions(agenda.sessions, agenda.asOf);

  return (
    <main
      id="conteudo"
      tabIndex={-1}
      className="site-container flex-1 py-10 sm:py-16"
    >
      <div className="mx-auto max-w-5xl">
        <p className="eyebrow">PAINEL</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
          <h1 className="max-w-xl text-4xl font-medium tracking-tight sm:text-5xl">
            Sua monitoria, em perspectiva.
          </h1>
          <Button asChild variant="outline" className="min-h-11 px-4">
            <Link href="/monitor/agenda">
              Abrir agenda <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <section aria-labelledby="upcoming-title" className="mt-10">
          <h2 id="upcoming-title" className="text-lg font-medium">
            Próximas quatro semanas
          </h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              ["Solicitações a atender", summary.expected],
              ["Sessões agendadas", summary.upcoming.length],
              ["Ocupação prevista", `${summary.occupancy}%`],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-border bg-card p-5"
              >
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="mt-3 font-mono text-3xl tracking-tight">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section
            aria-labelledby="sessions-title"
            className="rounded-2xl border border-border bg-card p-5 sm:p-6"
          >
            <h2 id="sessions-title" className="text-lg font-medium">
              Próximos encontros
            </h2>
            {summary.upcoming.length ? (
              <ul className="mt-4 divide-y divide-border">
                {summary.upcoming.slice(0, 3).map((session) => (
                  <li key={session.id}>
                    <Link
                      href={`/monitor/agenda?sessao=${session.id}`}
                      className="flex min-h-16 items-center justify-between gap-4 rounded-sm py-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="capitalize">
                        {sessionLabel(session.id)}
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {monitoria.horario}
                        </span>
                      </span>
                      <span className="shrink-0 font-mono text-xs">
                        {session.enrolledCount}/{monitoria.capacidade} alunos
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Nenhuma sessão futura neste período.
              </p>
            )}
          </section>
          <section
            aria-labelledby="topics-title"
            className="rounded-2xl border border-border bg-card p-5 sm:p-6"
          >
            <h2 id="topics-title" className="text-lg font-medium">
              Assuntos dos próximos encontros
            </h2>
            {summary.topics.length ? (
              <ul className="mt-4 divide-y divide-border">
                {summary.topics.map((topic) => (
                  <li
                    key={topic.id}
                    className="flex items-center justify-between gap-4 py-4 text-sm"
                  >
                    <span>{topic.titulo}</span>
                    <span className="font-mono text-xs">{topic.count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Os assuntos aparecem quando houver inscrições confirmadas.
              </p>
            )}
          </section>
        </div>
        <section aria-labelledby="recent-title" className="mt-10">
          <h2 id="recent-title" className="text-lg font-medium">
            Últimos 28 dias
          </h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              ["Pedidos recebidos", agenda.receivedRequests],
              ["Sessões realizadas", summary.completed],
              ["Presenças", summary.present],
              ["Ausências", summary.absent],
              ["Comparecimentos sem registro", summary.unrecorded],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-border bg-card p-5"
              >
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="mt-3 font-mono text-3xl tracking-tight">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <div
            role="note"
            aria-label="Sobre os indicadores"
            className="mt-5 flex items-start gap-3 rounded-xl border border-border bg-muted p-4 text-foreground sm:p-5"
          >
            <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            <p className="text-sm leading-6">
              Pedidos recebidos contam inscrições criadas no período, incluindo
              canceladas e destinos de remarcação. O comparecimento é registrado
              pelo monitor.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
