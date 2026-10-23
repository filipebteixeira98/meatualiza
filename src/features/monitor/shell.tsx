"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DropdownMenu } from "radix-ui";
import {
  CalendarDays,
  ChevronsUpDown,
  CircleUserRound,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
} from "lucide-react";
import { Brand } from "@/components/site/brand";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AuthNotice, useSignOut } from "@/features/auth/actions";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/monitor", label: "Painel", icon: LayoutDashboard },
  { href: "/monitor/agenda", label: "Agenda", icon: CalendarDays },
];

type Account = { displayName: string; email: string };

function MonitorNavigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Navegação do monitor" className="space-y-1">
      {navigation.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={pathname === href ? "page" : undefined}
          onClick={onNavigate}
          className={cn(
            "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring",
            pathname === href &&
              "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
          )}
        >
          <Icon className="size-4 shrink-0" aria-hidden="true" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

function AccountMenu({
  account,
  signOut,
}: {
  account: Account;
  signOut: ReturnType<typeof useSignOut>;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          variant="ghost"
          className="h-auto min-h-14 w-full justify-start gap-3 px-2 text-left"
          aria-label="Abrir menu da conta"
          disabled={!signOut.ready}
        >
          <CircleUserRound
            className="size-8 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">
              {account.displayName}
            </span>
            <span className="block text-xs font-normal text-muted-foreground">
              Monitor
            </span>
          </span>
          <ChevronsUpDown
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          side="top"
          sideOffset={8}
          collisionPadding={16}
          className="z-50 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-lg"
        >
          <DropdownMenu.Label className="px-2 py-2">
            <span className="block text-xs text-muted-foreground">
              Conta Google
            </span>
            <span className="mt-1 block break-all text-sm font-normal">
              {account.email}
            </span>
          </DropdownMenu.Label>
          <DropdownMenu.Separator className="my-2 h-px bg-border" />
          <DropdownMenu.Item
            disabled={!signOut.ready || signOut.busy}
            onSelect={(event) => {
              event.preventDefault();
              void signOut.leave();
            }}
            className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2 text-sm outline-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-accent data-highlighted:text-accent-foreground"
            aria-busy={signOut.busy}
          >
            {signOut.busy ? (
              <LoaderCircle
                className="size-4 motion-safe:animate-spin"
                aria-hidden="true"
              />
            ) : (
              <LogOut className="size-4" aria-hidden="true" />
            )}
            {signOut.busy ? "Saindo…" : "Sair da conta"}
          </DropdownMenu.Item>
          <AuthNotice message={signOut.message} />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function MonitorShell({
  account,
  children,
}: {
  account: Account;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const signOut = useSignOut();
  return (
    <div className="min-h-svh flex-1 lg:pl-64">
      <aside
        aria-label="Área do monitor"
        className="fixed inset-y-0 left-0 hidden w-64 flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar px-4 py-6 text-sidebar-foreground lg:flex"
      >
        <div className="px-2">
          <Brand />
        </div>
        <p className="eyebrow mt-10 mb-3 px-3">MONITORIA / L7</p>
        <MonitorNavigation />
        <div className="mt-auto border-t border-sidebar-border pt-4">
          <AccountMenu account={account} signOut={signOut} />
        </div>
      </aside>
      <header className="flex min-h-18 items-center gap-3 border-b border-border px-5 sm:px-8">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-11 lg:hidden"
              aria-label="Abrir navegação do monitor"
            >
              <Menu aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="gap-0 overflow-y-auto bg-sidebar p-4 text-sidebar-foreground data-[side=left]:w-[min(88vw,18rem)]"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Navegação do monitor</SheetTitle>
              <SheetDescription>
                Acesse o painel, a agenda e o menu da sua conta.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-3 px-2">
              <Brand />
            </div>
            <p className="eyebrow mt-10 mb-3 px-3">MONITORIA / L7</p>
            <MonitorNavigation onNavigate={() => setOpen(false)} />
            <div className="mt-auto border-t border-sidebar-border pt-4">
              <AccountMenu account={account} signOut={signOut} />
            </div>
          </SheetContent>
        </Sheet>
        <span className="text-sm font-medium">Área do monitor</span>
        <span className="ml-auto hidden text-xs text-muted-foreground sm:block">
          Lógica de Programação
        </span>
      </header>
      {children}
    </div>
  );
}
