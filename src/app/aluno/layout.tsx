import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { WorkspaceShell } from "@/features/workspace/shell";
import { getAccountProfile, SESSION_COOKIE } from "@/lib/auth/session";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getAccountProfile(
    (await cookies()).get(SESSION_COOKIE)?.value,
  );
  if (!profile) redirect("/entrar");
  // As páginas mantêm seus próprios redirecionamentos e a autorização junto aos dados.
  if (profile.role !== "student") return children;
  return (
    <WorkspaceShell
      role="student"
      account={{ displayName: profile.displayName, email: profile.email }}
    >
      {children}
    </WorkspaceShell>
  );
}
