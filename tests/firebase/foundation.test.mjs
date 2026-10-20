import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { afterEach, beforeEach, test } from "node:test";
import { deleteApp, getApps } from "firebase/app";
import { signInWithCustomToken, signOut } from "firebase/auth";
import {
  connectFirestoreEmulator,
  doc,
  getDoc,
  getFirestore,
  setDoc,
} from "firebase/firestore";
import {
  deleteApp as deleteAdminApp,
  getApps as getAdminApps,
} from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";
import { getAdminApp } from "../../src/lib/firebase/admin.ts";
import { getBrowserAuth } from "../../src/lib/firebase/client.ts";

assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, "127.0.0.1:9099");
assert.equal(process.env.FIRESTORE_EMULATOR_HOST, "127.0.0.1:8080");
assert.equal(process.env.GCLOUD_PROJECT, "demo-meatualiza");

const settings = {
  NEXT_PUBLIC_FIREBASE_API_KEY: "demo-api-key",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "demo-meatualiza.firebaseapp.com",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-meatualiza",
  NEXT_PUBLIC_FIREBASE_APP_ID: "demo-app-id",
  NEXT_PUBLIC_FIREBASE_USE_EMULATORS: "true",
  FIREBASE_PROJECT_ID: "demo-meatualiza",
  FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
  FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
  NODE_ENV: "test",
};
const original = Object.fromEntries(
  Object.keys(settings).map((key) => [key, process.env[key]]),
);

beforeEach(() => Object.assign(process.env, settings));
afterEach(async () => {
  await Promise.all([
    ...getApps().map(deleteApp),
    ...getAdminApps().map(deleteAdminApp),
  ]);
  for (const [key, value] of Object.entries(original)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test("missing public configuration fails without creating an app", () => {
  for (const key of [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
  ]) {
    process.env[key] = " ";
    assert.throws(getBrowserAuth, /Configuração pública.*incompleta/);
    assert.equal(getApps().length, 0);
    process.env[key] = settings[key];
  }
});

test("server initialization requires an explicit project", () => {
  delete process.env.FIREBASE_PROJECT_ID;
  assert.throws(getAdminApp, /FIREBASE_PROJECT_ID não configurado/);
  assert.equal(getAdminApps().length, 0);
});

test("emulators cannot use a real project and demo projects cannot reach cloud", () => {
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "meatualiza-monitoria";
  process.env.FIREBASE_PROJECT_ID = "meatualiza-monitoria";
  assert.throws(getBrowserAuth, /projeto demo-/);
  assert.throws(getAdminApp, /projeto demo-/);
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "demo-meatualiza";
  process.env.FIREBASE_PROJECT_ID = "demo-meatualiza";
  process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATORS = "false";
  delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
  delete process.env.FIRESTORE_EMULATOR_HOST;
  assert.throws(getBrowserAuth, /projeto demo-/);
  assert.throws(getAdminApp, /projeto demo-/);
});

test("server rejects partial or non-local emulator configuration", () => {
  delete process.env.FIRESTORE_EMULATOR_HOST;
  assert.throws(getAdminApp, /dois emuladores locais/);
  process.env.FIRESTORE_EMULATOR_HOST = "example.com:8080";
  assert.throws(getAdminApp, /dois emuladores locais/);
});

test("production rejects emulator connections", () => {
  process.env.NODE_ENV = "production";
  assert.throws(getBrowserAuth, /não são permitidos em produção/);
  assert.throws(getAdminApp, /não são permitidos em produção/);
});

test("SDK initialization is repeatable and Auth connects to the local emulator", () => {
  const auth = getBrowserAuth();
  assert.equal(getBrowserAuth(), auth);
  assert.equal(getAdminApp(), getAdminApp());
  assert.equal(auth.emulatorConfig.host, "127.0.0.1");
  assert.equal(auth.emulatorConfig.port, 9099);
});

test("Admin writes work, while direct Firestore access is denied for every client role", async () => {
  const admin = getAdminApp();
  const serverDocument = getAdminFirestore(admin).doc("users/student-a");
  await serverDocument.set({ displayName: "Aluno A" });
  assert.equal((await serverDocument.get()).data().displayName, "Aluno A");

  const auth = getBrowserAuth();
  const database = getFirestore(auth.app);
  connectFirestoreEmulator(database, "127.0.0.1", 8080);
  const clientDocument = doc(database, "users/student-a");

  for (const identity of [
    null,
    { uid: "student-a" },
    { uid: "monitor", monitor: true },
  ]) {
    if (identity) {
      const token = await getAdminAuth(admin).createCustomToken(identity.uid, {
        monitor: identity.monitor === true,
      });
      await signInWithCustomToken(auth, token);
      assert.equal(auth.currentUser.uid, identity.uid);
      assert.equal(
        (await auth.currentUser.getIdTokenResult()).claims.monitor,
        identity.monitor === true,
      );
    }
    await assert.rejects(getDoc(clientDocument), { code: "permission-denied" });
    await assert.rejects(setDoc(clientDocument, { monitor: true }), {
      code: "permission-denied",
    });
    if (identity) await signOut(auth);
  }
});

test("Admin module rejects imports outside the server environment", () => {
  const result = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      "await import('./src/lib/firebase/admin.ts')",
    ],
    { cwd: process.cwd(), encoding: "utf8" },
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /cannot be imported from a Client Component/);
});
