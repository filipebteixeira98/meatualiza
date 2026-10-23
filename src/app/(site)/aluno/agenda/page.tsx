import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/features/auth/actions";
import { Agenda } from "@/features/schedule/agenda";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { getAgenda } from "@/lib/bookings";
import { monitoria } from "@/lib/monitoria";

export const metadata: Metadata = {
  title: "Minha agenda",
  robots: { index: false, follow: false },
};

export default async function StudentAgendaPage() {
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
        <Button asChild variant="ghost" className="mb-8 min-h-11">
          <Link href="/aluno">
            <ArrowLeft aria-hidden="true" />
            Minha área
          </Link>
        </Button>
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
        <Agenda sessions={agenda.sessions} />
        <div className="mt-7">
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
