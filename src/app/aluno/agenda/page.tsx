import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Agenda } from "@/features/schedule/agenda";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { getAgenda } from "@/lib/bookings";
import { monitoria } from "@/lib/monitoria";

export const metadata: Metadata = {
  title: "Minha agenda",
  robots: { index: false, follow: false },
};

export default async function StudentAgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ sessao?: string }>;
}) {
  const agenda = await getAgenda((await cookies()).get(SESSION_COOKIE)?.value);
  if (!agenda) redirect("/entrar");
  if (agenda.role === "monitor") redirect("/monitor/agenda");
  return (
    <main
      id="conteudo"
      tabIndex={-1}
      className="site-container flex-1 py-10 sm:py-16"
    >
      <div className="mx-auto max-w-2xl">
        <p className="eyebrow">SUA AGENDA / L7</p>
        <h1 className="mt-4 text-4xl font-medium tracking-tight sm:text-5xl">
          Um horário para destravar.
        </h1>
        <p className="mt-5 text-base leading-7 text-muted-foreground">
          Segundas e quartas, {monitoria.horario}. Encontros em grupo no{" "}
          {monitoria.instituicao}, {monitoria.local}. Horários em America/Bahia.
        </p>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          Próximas quatro semanas, até {monitoria.termino}. Inscrição, edição,
          cancelamento e troca encerram no início da sessão.
        </p>
        <Agenda
          sessions={agenda.sessions}
          initialSessionId={(await searchParams).sessao}
        />
      </div>
    </main>
  );
}
