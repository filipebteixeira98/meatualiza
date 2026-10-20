import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CodeXml } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Acesso à plataforma" };

export default function SignInPage() {
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
        <p className="eyebrow mt-6">NOS VEMOS EM BREVE</p>
        <h1
          id="sign-in-title"
          className="mt-3 text-3xl font-medium tracking-tight"
        >
          Estamos preparando
          <br />
          seu próximo passo.
        </h1>
        <p className="mt-5 text-sm leading-7 text-muted-foreground">
          O acesso à plataforma ainda não está disponível. Em breve, você poderá
          entrar com sua conta Google para agendar a monitoria e acompanhar suas
          dúvidas.
        </p>
        <Button asChild variant="outline" className="mt-7 w-full">
          <Link href="/">
            <ArrowLeft aria-hidden="true" />
            Voltar para a monitoria
          </Link>
        </Button>
      </section>
    </main>
  );
}
