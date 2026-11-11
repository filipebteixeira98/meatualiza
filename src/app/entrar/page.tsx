import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Brand } from "@/components/site/brand";
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
    <div className="flex min-h-svh flex-1 flex-col">
      <header className="site-container flex items-center justify-between gap-4 py-4 sm:py-6">
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
        className="site-container grid flex-1 items-center gap-12 py-6 lg:grid-cols-2 lg:gap-16 lg:py-8"
      >
        <div
          aria-hidden="true"
          className="relative hidden h-[min(40rem,calc(100svh-10rem))] overflow-hidden rounded-3xl lg:block"
        >
          <Image
            src="/images/sign-in-illustration.webp"
            alt=""
            fill
            loading="eager"
            sizes="(min-width: 1216px) 544px, (min-width: 1024px) calc(50vw - 64px), 0px"
            className="object-cover"
          />
        </div>
        <section
          aria-labelledby="sign-in-title"
          className="mx-auto w-full max-w-sm text-center"
        >
          <h1
            id="sign-in-title"
            className="text-4xl leading-tight font-medium tracking-[-0.055em] sm:text-[2.5rem]"
          >
            Vamos continuar?
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Acesse sua agenda e acompanhe suas dúvidas.
          </p>
          <GoogleSignIn />
          <p className="mt-4 text-center text-xs leading-6 text-muted-foreground">
            Use sua conta Google pessoal ou institucional.
          </p>
        </section>
      </main>
    </div>
  );
}
