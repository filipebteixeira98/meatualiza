import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Brand } from "./brand";
import { monitoria } from "@/lib/monitoria";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background py-9">
      <div className="site-container flex flex-col justify-between gap-7 sm:flex-row sm:items-center">
        <div>
          <Brand />
          <p className="mt-3 text-sm text-muted-foreground">
            Um espaço para perguntar, praticar e avançar.
          </p>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground sm:text-right">
          <p>
            {monitoria.instituicao} · {monitoria.local}
          </p>
          <Link
            href="/#perguntas"
            className="inline-flex items-center gap-1.5 rounded-sm text-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
          >
            Conheça a monitoria{" "}
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
