import "server-only";

import {
  applicationDefault,
  getApp,
  getApps,
  initializeApp,
} from "firebase-admin/app";

export function getAdminApp() {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  if (!projectId) {
    throw new Error("FIREBASE_PROJECT_ID não configurado no servidor.");
  }

  const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST;
  const emulated = Boolean(authHost || firestoreHost);
  if (
    emulated &&
    (authHost !== "127.0.0.1:9099" || firestoreHost !== "127.0.0.1:8080")
  ) {
    throw new Error("Configure os dois emuladores locais do Firebase.");
  }
  if (emulated !== projectId.startsWith("demo-")) {
    throw new Error("Emuladores do Firebase exigem um projeto demo-.");
  }
  if (emulated && process.env.NODE_ENV === "production") {
    throw new Error("Emuladores do Firebase não são permitidos em produção.");
  }

  return getApps().length
    ? getApp()
    : initializeApp({
        projectId,
        ...(emulated ? {} : { credential: applicationDefault() }),
      });
}
