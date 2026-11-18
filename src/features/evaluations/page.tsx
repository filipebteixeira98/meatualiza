import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ClipboardCheck } from "lucide-react";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { getAgenda } from "@/lib/bookings";
import {
  summarizeEvaluations,
  resolutionLabels,
  type EvaluationEntry,
} from "@/lib/evaluations";
import { helpRequestTopics } from "@/lib/help-request";
import { monitoria } from "@/lib/monitoria";
import { attendanceLabels, sessionLabel } from "@/lib/schedule";
import { EvaluationForm } from "./form";

function EvaluationCard({
  entry,
  monitor,
}: {
  entry: EvaluationEntry;
  monitor: boolean;
}) {
  const { registration } = entry;
  const evaluation = registration.evaluation;
  const helpRequest = evaluation?.helpRequest ?? registration.helpRequest;
  return (
    <article
      aria-label={`Atendimento de ${entry.displayName ?? "aluno"} em ${sessionLabel(entry.sessionId)}`}
      className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-7"
    >
      <h3 className="text-lg font-medium capitalize [overflow-wrap:anywhere]">
        {entry.displayName ?? sessionLabel(entry.sessionId)}
      </h3>
      {monitor && (
        <p className="mt-2 text-sm capitalize text-muted-foreground">
          {sessionLabel(entry.sessionId)}
        </p>
      )}
      <p className="mt-2 text-xs leading-6 text-muted-foreground">
        {monitoria.horario} · {attendanceLabels[registration.attendance]}
      </p>
      <p className="mt-4 text-sm font-medium">
        {
          helpRequestTopics.find((topic) => topic.id === helpRequest.topicId)
            ?.titulo
        }
      </p>
      <details className="mt-2 text-sm">
        <summary className="cursor-pointer rounded-sm py-2 text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring">
          Ver dúvida atendida
        </summary>
        <p className="mt-2 leading-7 whitespace-pre-wrap [overflow-wrap:anywhere]">
          {helpRequest.description}
        </p>
      </details>
      {evaluation ? (
        <div className="mt-5 border-t border-border pt-5">
          <p className="flex items-center gap-2 text-sm font-medium">
            <ClipboardCheck aria-hidden="true" className="size-4 shrink-0" />
            {resolutionLabels[evaluation.resolution]}
          </p>
          {evaluation.comment && (
            <p className="mt-3 text-sm leading-7 whitespace-pre-wrap [overflow-wrap:anywhere]">
              {evaluation.comment}
            </p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Enviada em{" "}
            <time dateTime={evaluation.submittedAt}>
              {new Intl.DateTimeFormat("pt-BR", {
                dateStyle: "short",
                timeStyle: "short",
                timeZone: monitoria.fuso,
              }).format(new Date(evaluation.submittedAt))}
            </time>
          </p>
        </div>
      ) : monitor ? (
        <p className="mt-5 text-sm text-muted-foreground">
          Aguardando avaliação do aluno.
        </p>
      ) : (
        <EvaluationForm
          sessionId={entry.sessionId}
          version={registration.version}
        />
      )}
    </article>
  );
}

export async function EvaluationsPage({
  role,
}: {
  role: "student" | "monitor";
}) {
  const agenda = await getAgenda(
    (await cookies()).get(SESSION_COOKIE)?.value,
    undefined,
    "evaluations",
  );
  if (!agenda) redirect("/entrar");
  if (agenda.role !== role)
    redirect(
      agenda.role === "monitor" ? "/monitor/avaliacoes" : "/aluno/avaliacoes",
    );
  const summary = summarizeEvaluations(agenda.sessions);
  const monitor = role === "monitor";
  return (
    <main
      id="conteudo"
      tabIndex={-1}
      className="site-container flex-1 py-10 sm:py-16"
    >
      <div className="mx-auto max-w-4xl">
        <p className="eyebrow">AVALIAÇÕES</p>
        <h1 className="mt-4 max-w-2xl text-4xl font-medium tracking-tight sm:text-5xl">
          {monitor
            ? "O que avançou nos encontros."
            : "Sua dúvida foi resolvida?"}
        </h1>
        <p className="mt-5 text-base leading-7 text-muted-foreground">
          {monitor
            ? "Acompanhe os resultados informados pelos alunos."
            : "Conte como ficou sua dúvida após a monitoria."}
        </p>
        {summary.pending.length === 0 && summary.responded.length === 0 && (
          <p
            role="status"
            className="mt-8 rounded-2xl border border-dashed border-border p-6 text-sm leading-7 text-muted-foreground"
          >
            As avaliações ficam disponíveis após a sessão realizada e o registro
            de presença.
          </p>
        )}
        {[
          {
            title: "Aguardando avaliação",
            entries: summary.pending,
            id: "pending",
          },
          {
            title: "Avaliações respondidas",
            entries: summary.responded,
            id: "responded",
          },
        ]
          .filter((group) => group.entries.length > 0)
          .map((group) => (
            <section
              key={group.id}
              aria-labelledby={`evaluations-${group.id}`}
              className="mt-10"
            >
              <h2
                id={`evaluations-${group.id}`}
                className="text-xl font-medium"
              >
                {group.title}{" "}
                <span className="font-mono text-sm text-muted-foreground">
                  ({group.entries.length})
                </span>
              </h2>
              <div className="mt-5 grid items-start gap-4 md:grid-cols-2">
                {group.entries.map((entry) => (
                  <EvaluationCard
                    key={`${entry.sessionId}-${entry.studentId}`}
                    entry={entry}
                    monitor={monitor}
                  />
                ))}
              </div>
            </section>
          ))}
      </div>
    </main>
  );
}
