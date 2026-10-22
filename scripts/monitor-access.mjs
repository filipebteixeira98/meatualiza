import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "../src/lib/firebase/admin.ts";

const [action, uid, ...extra] = process.argv.slice(2);
if (
  !["grant", "revoke"].includes(action) ||
  !uid ||
  uid.length > 128 ||
  uid.includes("/") ||
  extra.length
) {
  console.error("Uso: npm run monitor:access -- grant|revoke UID");
  process.exitCode = 1;
} else {
  try {
    const app = getAdminApp();
    const auth = getAuth(app);
    const user = await auth.getUser(uid);
    if (
      action === "grant" &&
      (user.disabled ||
        !user.providerData.some(
          (provider) => provider.providerId === "google.com",
        ))
    ) {
      throw new Error("Conta Google ativa necessária.");
    }
    const claims = { ...user.customClaims };
    if (action === "grant") claims.monitor = true;
    else delete claims.monitor;
    await auth.setCustomUserClaims(uid, claims);
    if (action === "revoke") await auth.revokeRefreshTokens(uid);
    console.info(
      JSON.stringify({
        project: app.options.projectId,
        action,
        monitor: action === "grant",
      }),
    );
  } catch {
    console.error(
      "Não foi possível alterar o acesso. Confira UID, projeto e credencial administrativa.",
    );
    process.exitCode = 1;
  }
}
