"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage() {
  return (
    <main id="conteudo" tabIndex={-1} className="site-container flex-1 py-20">
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-7">
        <h1 className="text-2xl font-medium">
          Não conseguimos abrir esta página.
        </h1>
        <p
          role="alert"
          className="mt-4 text-sm leading-7 text-muted-foreground"
        >
          O serviço está temporariamente indisponível. Tente novamente em
          instantes.
        </p>
        <Button className="mt-6 h-11" onClick={() => window.location.reload()}>
          Tentar novamente
        </Button>
      </div>
    </main>
  );
}
