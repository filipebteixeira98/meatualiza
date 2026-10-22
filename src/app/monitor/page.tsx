import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { SignOutButton } from "@/features/auth/actions";
import { getAccountProfile, SESSION_COOKIE } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Sua área de monitor",
  robots: { index: false, follow: false },
};

export default async function MonitorPage() {
  const profile = await getAccountProfile(
    (await cookies()).get(SESSION_COOKIE)?.value,
  );
  if (!profile) redirect("/entrar");
  if (profile.role !== "monitor") redirect("/aluno");

  return (
    <main
      id="conteudo"
      tabIndex={-1}
      className="site-container flex-1 py-14 sm:py-20"
    >
      <div className="mx-auto max-w-2xl">
        <p className="eyebrow">ÁREA DO MONITOR · L7</p>
        <h1 className="mt-4 text-4xl font-medium tracking-tight sm:text-5xl">
          Seu próximo encontro começa aqui.
        </h1>
        <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
          Um espaço para preparar a monitoria de Lógica de Programação.
        </p>
        <section
          aria-labelledby="monitor-account-title"
          className="mt-9 rounded-2xl border border-border bg-card p-6 sm:p-8"
        >
          <h2
            id="monitor-account-title"
            className="flex items-center gap-3 text-xl font-medium"
          >
            <ShieldCheck className="size-5 shrink-0" aria-hidden="true" />
            Acesso de monitor ativo.
          </h2>
          <dl className="mt-6 space-y-5">
            <div>
              <dt className="eyebrow">NOME</dt>
              <dd className="mt-2 break-words text-lg">
                {profile.displayName}
              </dd>
            </div>
            <div>
              <dt className="eyebrow">CONTA GOOGLE</dt>
              <dd className="mt-2 break-words text-sm text-muted-foreground">
                {profile.email}
              </dd>
            </div>
          </dl>
          <p className="mt-7 border-t border-border pt-6 text-sm leading-7 text-muted-foreground">
            Nas próximas etapas, você poderá acompanhar a agenda, os alunos
            inscritos e as dúvidas de cada encontro por aqui.
          </p>
        </section>
        <div className="mt-7">
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
