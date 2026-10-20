"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import {
  browserPopupRedirectResolver,
  connectAuthEmulator,
  inMemoryPersistence,
  initializeAuth,
} from "firebase/auth";

export function getBrowserAuth() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim(),
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim(),
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim(),
  };

  if (
    !config.apiKey ||
    !config.authDomain ||
    !config.projectId ||
    !config.appId
  ) {
    throw new Error("Configuração pública do Firebase incompleta.");
  }

  const emulated = process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATORS === "true";
  if (emulated !== config.projectId.startsWith("demo-")) {
    throw new Error("Emuladores do Firebase exigem um projeto demo-.");
  }
  if (emulated && process.env.NODE_ENV === "production") {
    throw new Error("Emuladores do Firebase não são permitidos em produção.");
  }

  const app = getApps().length ? getApp() : initializeApp(config);
  const auth = initializeAuth(app, {
    persistence: inMemoryPersistence,
    popupRedirectResolver:
      typeof window === "undefined" ? undefined : browserPopupRedirectResolver,
  });
  if (emulated && !auth.emulatorConfig) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", {
      disableWarnings: true,
    });
  }
  return auth;
}
