import Link from "next/link";
import { ArrowUpRight, Menu } from "lucide-react";
import { Brand } from "./brand";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navigation = [
  { label: "Como funciona", href: "/#como-funciona" },
  { label: "Conteúdos", href: "/#conteudos" },
  { label: "Perguntas frequentes", href: "/#perguntas" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-border/70 bg-background">
      <div className="site-container flex h-20 items-center justify-between gap-6">
        <Brand />
        <nav
          aria-label="Navegação principal"
          className="hidden items-center gap-7 lg:flex"
        >
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/entrar">
              Acessar plataforma <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="size-11 lg:hidden"
                aria-label="Abrir menu"
              >
                <Menu aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(90vw,22rem)]">
              <SheetHeader>
                <SheetTitle>Explore a monitoria</SheetTitle>
                <SheetDescription>
                  Lógica de Programação, uma dúvida de cada vez.
                </SheetDescription>
              </SheetHeader>
              <nav
                aria-label="Navegação móvel"
                className="flex flex-col gap-2 px-4"
              >
                {navigation.map((item) => (
                  <SheetClose key={item.href} asChild>
                    <Link
                      href={item.href}
                      className="rounded-lg px-3 py-4 text-base transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
                <SheetClose asChild>
                  <Button asChild className="mt-4">
                    <Link href="/entrar">
                      Acessar plataforma <ArrowUpRight aria-hidden="true" />
                    </Link>
                  </Button>
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
