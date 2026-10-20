import Link from "next/link";
import { CodeXml } from "lucide-react";

export function Brand() {
  return (
    <Link
      href="/"
      aria-label="meatualiza — página inicial"
      className="inline-flex items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
    >
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <CodeXml className="size-5" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <span className="text-xl font-semibold tracking-[-0.055em]">
        meatualiza<span className="text-muted-foreground">.</span>
      </span>
    </Link>
  );
}
