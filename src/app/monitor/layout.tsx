import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { WorkspaceShell } from "@/features/workspace/shell";
import { getAccountProfile, SESSION_COOKIE } from "@/lib/auth/session";

export default async function MonitorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getAccountProfile(
    (await cookies()).get(SESSION_COOKIE)?.value,
  );
  if (!profile) redirect("/entrar");
  // Cada página mantém seu redirecionamento e sua autorização junto aos dados.
  if (profile.role !== "monitor") return children;

  return (
    <WorkspaceShell
      role="monitor"
      account={{ displayName: profile.displayName, email: profile.email }}
    >
      {children}
    </WorkspaceShell>
  );
}
