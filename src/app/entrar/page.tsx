import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Brand } from "@/components/site/brand";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { GoogleSignIn } from "@/features/auth/actions";
import { getAccountProfile, SESSION_COOKIE } from "@/lib/auth/session";
import { monitoria } from "@/lib/monitoria";

export const metadata: Metadata = { title: "Acesso à plataforma" };

export default async function SignInPage() {
  const profile = await getAccountProfile(
    (await cookies()).get(SESSION_COOKIE)?.value,
  );
  if (profile) redirect(profile.role === "monitor" ? "/monitor" : "/aluno");
  return (
    <div className="flex min-h-svh flex-1 flex-col">
      <header className="site-container flex items-center justify-between gap-4 py-6 sm:py-8">
        <Brand />
        <Link
          href="/"
          aria-label="Voltar para a monitoria"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>
            Voltar<span className="hidden sm:inline"> para a monitoria</span>
          </span>
        </Link>
      </header>
      <main
        id="conteudo"
        tabIndex={-1}
        className="site-container grid flex-1 items-center gap-12 py-10 sm:py-12 lg:grid-cols-2 lg:gap-20"
      >
        <aside
          aria-label="Monitoria no laboratório L7"
          className="hidden flex-col justify-between self-stretch rounded-3xl border border-border bg-card p-10 lg:flex xl:p-12"
        >
          <div>
            <p className="eyebrow">LÓGICA DE PROGRAMAÇÃO / MONITORIA</p>
            <p className="mt-7 text-[2.75rem] leading-[1.12] font-medium tracking-[-0.055em]">
              Dúvida faz parte.
              <br />
              Perguntar também.
            </p>
            <p className="mt-5 max-w-xs text-sm leading-7 text-muted-foreground">
              Um espaço para construir o raciocínio junto, uma dúvida de cada
              vez.
            </p>
          </div>
          <div className="mt-12">
            <p
              aria-hidden="true"
              className="font-mono text-[9rem] leading-none font-medium tracking-[-0.1em]"
            >
              L7<span className="text-muted-foreground">.</span>
            </p>
            <div className="mt-8 border-t border-border pt-6">
              <p className="text-sm">{monitoria.instituicao}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Segundas e quartas · {monitoria.horario}
              </p>
            </div>
          </div>
        </aside>
        <section
          aria-labelledby="sign-in-title"
          className="mx-auto w-full max-w-sm py-4 lg:py-16"
        >
          <p className="eyebrow">BEM-VINDO À MONITORIA</p>
          <h1
            id="sign-in-title"
            className="mt-4 text-4xl leading-tight font-medium tracking-[-0.055em] sm:text-5xl"
          >
            Seu lugar no L7.
          </h1>
          <p className="mt-5 text-sm leading-7 text-muted-foreground">
            Sua agenda, suas dúvidas e o próximo encontro. Entre para continuar.
          </p>
          <GoogleSignIn />
          <p className="mt-4 text-center text-xs leading-6 text-muted-foreground">
            Use sua conta Google pessoal ou institucional.
          </p>
          <div className="mt-10 border-t border-border pt-6 lg:hidden">
            <p className="text-sm">{monitoria.instituicao} · Laboratório L7</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Segundas e quartas · {monitoria.horario}
            </p>
          </div>
        </section>
      </main>
      <footer className="site-container flex flex-wrap items-center justify-between gap-3 py-6 text-xs text-muted-foreground">
        <p>{monitoria.disciplina}</p>
        <p className="eyebrow">PRESENCIAL / EM GRUPO</p>
      </footer>
    </div>
  );
}
