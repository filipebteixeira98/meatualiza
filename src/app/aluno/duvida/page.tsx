import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/features/auth/actions";
import { HelpRequestForm } from "@/features/help-request/form";
import { getAccountProfile, SESSION_COOKIE } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Preparar minha dúvida",
  robots: { index: false, follow: false },
};

export default async function HelpRequestPage() {
  const profile = await getAccountProfile(
    (await cookies()).get(SESSION_COOKIE)?.value,
  );
  if (!profile) redirect("/entrar");
  if (profile.role === "monitor") redirect("/monitor");

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
        <p className="eyebrow">LÓGICA DE PROGRAMAÇÃO / L7</p>
        <h1 className="mt-4 text-4xl font-medium tracking-tight sm:text-5xl">
          Qual é a sua dúvida?
        </h1>
        <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
          Separe o assunto e conte onde travou. Por enquanto, você pode preparar
          e revisar o texto; o agendamento chega na próxima etapa.
        </p>
        <HelpRequestForm />
        <div className="mt-7">
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
