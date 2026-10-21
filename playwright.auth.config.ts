import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

export default defineConfig({
  ...base,
  testDir: "./tests/auth",
  testIgnore: [],
  outputDir: "test-results/auth",
  use: { ...base.use, baseURL: "http://127.0.0.1:3101" },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3101",
    url: "http://127.0.0.1:3101",
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      NEXT_DIST_DIR: ".next/auth-tests",
      APP_ORIGIN: "http://127.0.0.1:3101",
      FIREBASE_PROJECT_ID: "demo-meatualiza",
      FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
      FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
      NEXT_PUBLIC_FIREBASE_API_KEY: "demo-api-key",
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "demo-meatualiza.firebaseapp.com",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-meatualiza",
      NEXT_PUBLIC_FIREBASE_APP_ID: "demo-app-id",
      NEXT_PUBLIC_FIREBASE_USE_EMULATORS: "true",
    },
  },
});
