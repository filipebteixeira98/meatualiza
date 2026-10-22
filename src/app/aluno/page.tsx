import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/features/auth/actions";
import { getAccountProfile, SESSION_COOKIE } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Sua área de monitoria",
  robots: { index: false, follow: false },
};

export default async function StudentPage() {
  const profile = await getAccountProfile(
    (await cookies()).get(SESSION_COOKIE)?.value,
  );
  if (!profile) redirect("/entrar");
  if (profile.role === "monitor") redirect("/monitor");

  return (
    <main
      id="conteudo"
      tabIndex={-1}
      className="site-container flex-1 py-14 sm:py-20"
    >
      <div className="mx-auto max-w-2xl">
        <p className="eyebrow">ÁREA DO ALUNO</p>
        <h1 className="mt-4 text-4xl font-medium tracking-tight sm:text-5xl">
          Seu ponto de partida.
        </h1>
        <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
          Uma conta para acompanhar seus próximos passos em Lógica de
          Programação.
        </p>
        <section
          aria-labelledby="account-title"
          className="mt-9 rounded-2xl border border-border bg-card p-6 sm:p-8"
        >
          <h2 id="account-title" className="text-xl font-medium">
            Você está por aqui.
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
            Em breve, você poderá escolher uma sessão e enviar sua dúvida por
            aqui.
          </p>
        </section>
        <div className="mt-7">
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
