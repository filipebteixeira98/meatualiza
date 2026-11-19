"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DropdownMenu } from "radix-ui";
import {
  CalendarDays,
  ChevronsUpDown,
  CircleUserRound,
  ClipboardCheck,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  MessageSquarePlus,
  MessagesSquare,
  PanelLeftClose,
  PanelLeftOpen,
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
import { WorkspaceTour } from "@/features/tour/workspace-tour";
import type { TourStatus } from "@/lib/tour";
import { cn } from "@/lib/utils";

const navigation = {
  monitor: [
    { href: "/monitor", label: "Painel", icon: LayoutDashboard },
    { href: "/monitor/agenda", label: "Agenda", icon: CalendarDays },
    { href: "/monitor/avaliacoes", label: "Avaliações", icon: ClipboardCheck },
    { href: "/monitor/forum", label: "Fórum", icon: MessagesSquare },
  ],
  student: [
    { href: "/aluno", label: "Painel", icon: LayoutDashboard },
    { href: "/aluno/agenda", label: "Agenda", icon: CalendarDays },
    { href: "/aluno/duvida", label: "Nova inscrição", icon: MessageSquarePlus },
    { href: "/aluno/avaliacoes", label: "Avaliações", icon: ClipboardCheck },
    { href: "/aluno/forum", label: "Fórum", icon: MessagesSquare },
  ],
};
type Role = keyof typeof navigation;
const roleNames = { monitor: "monitor", student: "aluno" };

type Account = { displayName: string; email: string };

function WorkspaceNavigation({
  role,
  onNavigate,
  collapsed = false,
}: {
  role: Role;
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  return (
    <nav
      aria-label={`Navegação do ${roleNames[role]}`}
      className="mt-8 space-y-1"
    >
      {navigation[role].map(({ href, label, icon: Icon }) => {
        const active =
          pathname === href ||
          (href.endsWith("/forum") && pathname.startsWith(`${href}/`));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            title={collapsed ? label : undefined}
            onClick={onNavigate}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-lg text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring",
              collapsed ? "justify-center px-0" : "px-3",
              active &&
                "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span className={collapsed ? "sr-only" : undefined}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function AccountMenu({
  account,
  role,
  signOut,
  collapsed = false,
}: {
  account: Account;
  role: Role;
  signOut: ReturnType<typeof useSignOut>;
  collapsed?: boolean;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "h-auto min-h-14 w-full gap-3 text-left",
            collapsed ? "justify-center px-0" : "justify-start px-2",
          )}
          aria-label="Abrir menu da conta"
          title={collapsed ? account.displayName : undefined}
          disabled={!signOut.ready}
        >
          <CircleUserRound
            className="size-8 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <span className={collapsed ? "sr-only" : "min-w-0 flex-1"}>
            <span className="block truncate text-sm font-medium">
              {account.displayName}
            </span>
            <span className="block text-xs font-normal text-muted-foreground">
              {role === "monitor" ? "Monitor" : "Aluno"}
            </span>
          </span>
          {!collapsed && (
            <ChevronsUpDown
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
          )}
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

export function WorkspaceShell({
  account,
  role,
  tourStatus,
  children,
}: {
  account: Account;
  role: Role;
  tourStatus: TourStatus | null;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const signOut = useSignOut();
  return (
    <div
      className={cn(
        "flex min-h-svh flex-1 flex-col",
        collapsed ? "lg:pl-20" : "lg:pl-64",
      )}
    >
      <aside
        id="workspace-sidebar"
        aria-label={`Área do ${roleNames[role]}`}
        className={cn(
          "fixed inset-y-0 left-0 hidden flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar py-6 text-sidebar-foreground lg:flex",
          collapsed ? "w-20 px-3" : "w-64 px-4",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-3",
            collapsed ? "flex-col" : "justify-between",
          )}
        >
          <Brand compact={collapsed} />
          <Button
            variant="ghost"
            size="icon"
            className="size-11"
            aria-label={
              collapsed ? "Expandir menu lateral" : "Recolher menu lateral"
            }
            title={
              collapsed ? "Expandir menu lateral" : "Recolher menu lateral"
            }
            aria-expanded={!collapsed}
            aria-controls="workspace-sidebar"
            disabled={!signOut.ready}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <PanelLeftOpen aria-hidden="true" />
            ) : (
              <PanelLeftClose aria-hidden="true" />
            )}
          </Button>
        </div>
        <WorkspaceNavigation role={role} collapsed={collapsed} />
        <div className="mt-auto border-t border-sidebar-border pt-4">
          <AccountMenu
            account={account}
            role={role}
            signOut={signOut}
            collapsed={collapsed}
          />
        </div>
      </aside>
      <WorkspaceTour
        role={role}
        initialStatus={tourStatus}
        mobileNavigation={
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-11 shrink-0 lg:hidden"
                aria-label={`Abrir navegação do ${roleNames[role]}`}
                disabled={!signOut.ready}
              >
                <Menu aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="gap-0 overflow-y-auto bg-sidebar p-4 text-sidebar-foreground data-[side=left]:w-[min(88vw,18rem)]"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Navegação do {roleNames[role]}</SheetTitle>
                <SheetDescription>
                  Acesse os recursos da sua área e o menu da conta.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-3 px-2">
                <Brand />
              </div>
              <WorkspaceNavigation
                role={role}
                onNavigate={() => setOpen(false)}
              />
              <div className="mt-auto border-t border-sidebar-border pt-4">
                <AccountMenu account={account} role={role} signOut={signOut} />
              </div>
            </SheetContent>
          </Sheet>
        }
      />
      {children}
    </div>
  );
}
