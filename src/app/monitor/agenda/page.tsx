import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Agenda } from "@/features/schedule/agenda";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { getAgenda } from "@/lib/bookings";

export const metadata: Metadata = {
  title: "Agenda do monitor",
  robots: { index: false, follow: false },
};

export default async function MonitorAgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ sessao?: string }>;
}) {
  const agenda = await getAgenda(
    (await cookies()).get(SESSION_COOKIE)?.value,
    undefined,
    "recent",
  );
  if (!agenda) redirect("/entrar");
  if (agenda.role !== "monitor") redirect("/aluno/agenda");
  return (
    <main
      id="conteudo"
      tabIndex={-1}
      className="site-container flex-1 py-10 sm:py-16"
    >
      <div className="mx-auto max-w-2xl">
        <p className="eyebrow">AGENDA DO MONITOR</p>
        <h1 className="mt-4 text-4xl font-medium tracking-tight sm:text-5xl">
          Prepare o próximo encontro.
        </h1>
        <p className="mt-5 text-base leading-7 text-muted-foreground">
          Inscritos, dúvidas e comparecimento. Consulte os próximos encontros e
          as sessões registradas nos últimos 28 dias.
        </p>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          Segundas e quartas, 11h30–12h30 · America/Bahia · dez alunos por
          sessão.
        </p>
        <Agenda
          sessions={agenda.sessions}
          monitor
          now={agenda.asOf}
          initialSessionId={(await searchParams).sessao}
        />
      </div>
    </main>
  );
}
