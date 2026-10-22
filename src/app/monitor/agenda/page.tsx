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

export const metadata: Metadata = {
  title: "Agenda do monitor",
  robots: { index: false, follow: false },
};

export default async function MonitorAgendaPage() {
  const agenda = await getAgenda((await cookies()).get(SESSION_COOKIE)?.value);
  if (!agenda) redirect("/entrar");
  if (agenda.role !== "monitor") redirect("/aluno/agenda");
  return (
    <main
      id="conteudo"
      tabIndex={-1}
      className="site-container flex-1 py-10 sm:py-16"
    >
      <div className="mx-auto max-w-2xl">
        <Button asChild variant="ghost" className="mb-8 min-h-11">
          <Link href="/monitor">
            <ArrowLeft aria-hidden="true" />
            Minha área
          </Link>
        </Button>
        <p className="eyebrow">AGENDA DO MONITOR / L7</p>
        <h1 className="mt-4 text-4xl font-medium tracking-tight sm:text-5xl">
          Prepare o próximo encontro.
        </h1>
        <p className="mt-5 text-base leading-7 text-muted-foreground">
          Acompanhe a quantidade de alunos previstos nas próximas quatro
          semanas. Bloqueie datas ou cancele encontros com um motivo visível aos
          inscritos.
        </p>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          Segundas e quartas, 11h30–12h30 · America/Bahia · dez alunos por
          sessão.
        </p>
        <Agenda sessions={agenda.sessions} monitor />
        <div className="mt-7">
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
