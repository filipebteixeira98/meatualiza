import { LoaderCircle } from "lucide-react";

export default function LoadingMonitorPage() {
  return (
    <main
      id="conteudo"
      tabIndex={-1}
      className="site-container flex flex-1 items-center justify-center py-20"
    >
      <p role="status" className="text-muted-foreground">
        <LoaderCircle
          className="size-8 motion-safe:animate-spin"
          aria-hidden="true"
        />
        <span className="sr-only">Carregando área do monitor…</span>
      </p>
    </main>
  );
}
