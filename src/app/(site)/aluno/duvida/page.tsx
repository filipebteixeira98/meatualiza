import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/features/auth/actions";
import { HelpRequestForm } from "@/features/help-request/form";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { getAgenda } from "@/lib/bookings";
import { monitoria } from "@/lib/monitoria";

export const metadata: Metadata = {
  title: "Preparar minha dúvida",
  robots: { index: false, follow: false },
};

export default async function HelpRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ sessao?: string }>;
}) {
  const agenda = await getAgenda((await cookies()).get(SESSION_COOKIE)?.value);
  if (!agenda) redirect("/entrar");
  if (agenda.role === "monitor") redirect("/monitor");
  const selected = (await searchParams).sessao;

  const selectedSession = agenda.sessions.find(({ id }) => id === selected);
  const validSelection =
    !selected ||
    (!!selectedSession &&
      selectedSession.status === "scheduled" &&
      (selectedSession.enrolledCount < monitoria.capacidade ||
        selectedSession.registration?.status === "confirmed"));
  return (
    <main
      id="conteudo"
      tabIndex={-1}
      className="site-container flex-1 py-10 sm:py-16"
    >
      <div className="mx-auto max-w-2xl">
        <Button asChild variant="ghost" className="mb-8 min-h-11">
          <Link href="/aluno/agenda">
            <ArrowLeft aria-hidden="true" />
            Ver agenda
          </Link>
        </Button>
        <p className="eyebrow">LÓGICA DE PROGRAMAÇÃO / L7</p>
        <h1 className="mt-4 text-4xl font-medium tracking-tight sm:text-5xl">
          Qual é a sua dúvida?
        </h1>
        <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
          Escolha uma sessão e conte onde travou. Sua dúvida será enviada junto
          à inscrição, com confirmação automática quando houver vaga.
        </p>
        {!validSelection ? (
          <p
            role="status"
            className="mt-9 rounded-2xl border border-border p-6 text-sm leading-7"
          >
            Esta sessão não está disponível. Consulte a agenda para escolher
            outro encontro.
          </p>
        ) : selectedSession?.registration?.status === "confirmed" ||
          agenda.sessions.some(
            (session) =>
              session.status === "scheduled" &&
              session.enrolledCount < monitoria.capacidade &&
              session.registration?.status !== "confirmed",
          ) ? (
          <HelpRequestForm
            sessions={agenda.sessions}
            initialSessionId={selected}
          />
        ) : (
          <p
            role="status"
            className="mt-9 rounded-2xl border border-border p-6 text-sm leading-7"
          >
            Não há sessões com vagas disponíveis. Consulte a agenda para
            acompanhar os próximos encontros.
          </p>
        )}
        <div className="mt-7">
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
