import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CodeXml } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { GoogleSignIn } from "@/features/auth/actions";
import { getAccountProfile, SESSION_COOKIE } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Acesso à plataforma" };

export default async function SignInPage() {
  const profile = await getAccountProfile(
    (await cookies()).get(SESSION_COOKIE)?.value,
  );
  if (profile) redirect(profile.role === "monitor" ? "/monitor" : "/aluno");
  return (
    <main
      id="conteudo"
      tabIndex={-1}
      className="site-container flex flex-1 items-center justify-center py-20 sm:py-28"
    >
      <section
        aria-labelledby="sign-in-title"
        className="w-full max-w-md rounded-2xl border border-border bg-card p-7 text-center sm:p-10"
      >
        <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-muted">
          <CodeXml className="size-6" aria-hidden="true" />
        </span>
        <p className="eyebrow mt-6">MONITORIA NO L7</p>
        <h1
          id="sign-in-title"
          className="mt-3 text-3xl font-medium tracking-tight"
        >
          Seu lugar no L7.
        </h1>
        <p className="mt-5 text-sm leading-7 text-muted-foreground">
          Entre com sua conta Google para acessar sua área de monitoria de
          Lógica de Programação. Qualquer conta Google é bem-vinda.
        </p>
        <GoogleSignIn />
        <Button asChild variant="ghost" className="mt-4 h-11 w-full">
          <Link href="/">
            <ArrowLeft aria-hidden="true" />
            Voltar para a monitoria
          </Link>
        </Button>
      </section>
    </main>
  );
}
