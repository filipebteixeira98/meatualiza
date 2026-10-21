import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, afterEach, test } from "node:test";
import { deleteApp, getApps } from "firebase/app";
import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithCustomToken,
  signOut,
} from "firebase/auth";
import {
  deleteApp as deleteAdminApp,
  getApps as getAdminApps,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { NextRequest } from "next/server.js";
import { getAdminApp } from "../../src/lib/firebase/admin.ts";
import { getBrowserAuth } from "../../src/lib/firebase/client.ts";
import {
  createStudentSession,
  getStudentProfile,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "../../src/lib/auth/session.ts";
import { CSRF_COOKIE, issueCsrf } from "../../src/lib/auth/http.ts";
import { POST, DELETE } from "../../src/app/api/auth/session/route.ts";

assert.equal(process.env.GCLOUD_PROJECT, "demo-meatualiza");
assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, "127.0.0.1:9099");
assert.equal(process.env.FIRESTORE_EMULATOR_HOST, "127.0.0.1:8080");
Object.assign(process.env, {
  NODE_ENV: "test",
  APP_ORIGIN: "http://localhost:3000",
  FIREBASE_PROJECT_ID: "demo-meatualiza",
  NEXT_PUBLIC_FIREBASE_API_KEY: "demo-api-key",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "demo-meatualiza.firebaseapp.com",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-meatualiza",
  NEXT_PUBLIC_FIREBASE_APP_ID: "demo-app-id",
  NEXT_PUBLIC_FIREBASE_USE_EMULATORS: "true",
});

afterEach(async () => {
  if (getApps().length) await signOut(getBrowserAuth());
});
after(async () => {
  await Promise.all([
    ...getApps().map(deleteApp),
    ...getAdminApps().map(deleteAdminApp),
  ]);
});

async function googleUser(sub = randomUUID()) {
  const { user } = await signInWithCredential(
    getBrowserAuth(),
    GoogleAuthProvider.credential(
      JSON.stringify({
        sub,
        email: `${sub}@example.test`,
        email_verified: true,
        name: "Aluno Sessão",
      }),
    ),
  );
  return { uid: user.uid, token: await user.getIdToken(), email: user.email };
}

async function request(method, body, headers = {}) {
  const response = issueCsrf();
  const { csrfToken } = await response.json();
  return new NextRequest("http://localhost:3000/api/auth/session", {
    method,
    headers: {
      origin: "http://localhost:3000",
      "content-type": "application/json",
      cookie: `${CSRF_COOKIE}=${csrfToken}`,
      ...headers,
    },
    body: JSON.stringify({ csrfToken, ...body }),
  });
}

test("Google token creates a five-day session and one identity-derived profile", async () => {
  const user = await googleUser();
  const response = await POST(await request("POST", { idToken: user.token }));
  assert.equal(response.status, 200);
  const cookie = response.cookies.get(SESSION_COOKIE);
  assert.equal(cookie.httpOnly, true);
  assert.equal(cookie.sameSite, "lax");
  assert.equal(cookie.path, "/");
  assert.equal(cookie.maxAge, SESSION_MAX_AGE);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal((await response.json()).ok, true);
  assert.deepEqual(await getStudentProfile(cookie.value), {
    uid: user.uid,
    email: user.email,
    displayName: "Aluno Sessão",
  });
  const stored = await getFirestore(getAdminApp())
    .doc(`users/${user.uid}`)
    .get();
  assert.ok(stored.get("createdAt"));
  assert.ok(stored.get("updatedAt"));
  assert.equal(stored.get("monitor"), undefined);
});

test("repeated and concurrent exchanges preserve the original profile creation time", async () => {
  const user = await googleUser();
  await createStudentSession(user.token);
  const database = getFirestore(getAdminApp());
  const reference = database.doc(`users/${user.uid}`);
  const first = (await reference.get()).get("createdAt").toMillis();
  await Promise.all([
    createStudentSession(user.token),
    createStudentSession(user.token),
  ]);
  assert.equal((await reference.get()).get("createdAt").toMillis(), first);
  assert.equal(
    (await database.collection("users").where("email", "==", user.email).get())
      .size,
    1,
  );
});

test("sessions only return the profile belonging to the verified cookie", async () => {
  const a = await googleUser();
  const cookieA = await createStudentSession(a.token);
  const b = await googleUser();
  const cookieB = await createStudentSession(b.token);
  assert.equal((await getStudentProfile(cookieA)).uid, a.uid);
  assert.equal((await getStudentProfile(cookieB)).uid, b.uid);
  assert.notEqual((await getStudentProfile(cookieA)).email, b.email);
  assert.equal(await getStudentProfile(), null);
  assert.equal(await getStudentProfile("tampered-cookie"), null);
});

test("invalid tokens, forged identity fields, wrong origin and invalid CSRF never create a cookie", async () => {
  const user = await googleUser();
  const [header, payload, signature] = user.token.split(".");
  const otherProjectToken = [
    header,
    Buffer.from(
      JSON.stringify({
        ...JSON.parse(Buffer.from(payload, "base64url").toString()),
        aud: "demo-another-project",
        iss: "https://securetoken.google.com/demo-another-project",
      }),
    ).toString("base64url"),
    signature,
  ].join(".");
  const cases = [
    [{ idToken: user.token, uid: "another-student" }, {}, 400],
    [{ idToken: user.token, monitor: true }, {}, 400],
    [{ idToken: user.token }, { origin: "https://other.example" }, 403],
    [{ idToken: user.token }, { origin: "" }, 403],
    [{ idToken: user.token }, { cookie: "" }, 403],
    [{ idToken: user.token, csrfToken: "0".repeat(64) }, {}, 403],
    [{ idToken: "invalid" }, {}, 401],
    [{ idToken: otherProjectToken }, {}, 401],
    [{ idToken: "x".repeat(9000) }, {}, 400],
    [{ idToken: "x".repeat(13000) }, {}, 413],
    [{ idToken: user.token }, { "content-type": "text/plain" }, 415],
  ];
  for (const [body, headers, status] of cases) {
    const response = await POST(await request("POST", body, headers));
    assert.equal(response.status, status);
    assert.equal(response.cookies.get(SESSION_COOKIE), undefined);
    assert.ok(!JSON.stringify(await response.json()).includes(user.token));
  }
  assert.equal(
    (await getFirestore(getAdminApp()).doc(`users/${user.uid}`).get()).exists,
    false,
  );
});

test("malformed JSON is refused before any identity operation", async () => {
  const response = await POST(
    new NextRequest("http://localhost:3000/api/auth/session", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
        "content-type": "application/json",
      },
      body: "{",
    }),
  );
  assert.equal(response.status, 400);
  assert.equal(response.cookies.get(SESSION_COOKIE), undefined);
});

test("non-Google identities cannot create student sessions", async () => {
  const auth = getBrowserAuth();
  const token = await getAuth(getAdminApp()).createCustomToken(
    `custom-${randomUUID()}`,
  );
  await signInWithCustomToken(auth, token);
  const response = await POST(
    await request("POST", { idToken: await auth.currentUser.getIdToken() }),
  );
  assert.equal(response.status, 401);
  assert.equal(response.cookies.get(SESSION_COOKIE), undefined);
});

test("an old sign-in cannot be exchanged for a new session", async (t) => {
  const user = await googleUser();
  const now = Date.now();
  t.mock.method(Date, "now", () => now + 301_000);
  const response = await POST(await request("POST", { idToken: user.token }));
  assert.equal(response.status, 401);
  assert.equal(response.cookies.get(SESSION_COOKIE), undefined);
});

test("expired session cookies are rejected", async (t) => {
  const user = await googleUser();
  const cookie = await createStudentSession(user.token);
  const now = Date.now();
  t.mock.method(Date, "now", () => now + (SESSION_MAX_AGE + 1) * 1000);
  assert.equal(await getStudentProfile(cookie), null);
});

test("disabled and revoked sessions cannot read a profile", async () => {
  const user = await googleUser();
  const cookie = await createStudentSession(user.token);
  const auth = getAuth(getAdminApp());
  await auth.updateUser(user.uid, { disabled: true });
  assert.equal(await getStudentProfile(cookie), null);
  await auth.updateUser(user.uid, { disabled: false });
  await new Promise((resolve) => setTimeout(resolve, 1100));
  await auth.revokeRefreshTokens(user.uid);
  assert.equal(await getStudentProfile(cookie), null);
});

test("failed profile persistence returns service unavailable without issuing a session", async (t) => {
  const user = await googleUser();
  t.mock.method(getFirestore(getAdminApp()), "runTransaction", async () => {
    throw new Error("Database unavailable");
  });
  const response = await POST(await request("POST", { idToken: user.token }));
  assert.equal(response.status, 503);
  assert.equal(response.cookies.get(SESSION_COOKIE), undefined);
  assert.equal(
    (await getFirestore(getAdminApp()).doc(`users/${user.uid}`).get()).exists,
    false,
  );
});

test("a database outage is not treated as a missing or invalid session", async (t) => {
  const user = await googleUser();
  const cookie = await createStudentSession(user.token);
  t.mock.method(getFirestore(getAdminApp()), "getAll", async () => {
    throw new Error("Database unavailable");
  });
  await assert.rejects(getStudentProfile(cookie), /Database unavailable/);
});

test("logout clears the current browser cookie and rejects a cross-origin request", async () => {
  const rejected = await DELETE(
    await request("DELETE", {}, { origin: "https://other.example" }),
  );
  assert.equal(rejected.status, 403);
  assert.equal(rejected.cookies.get(SESSION_COOKIE), undefined);
  const response = await DELETE(await request("DELETE", {}));
  assert.equal(response.status, 204);
  assert.equal(response.cookies.get(SESSION_COOKIE).maxAge, 0);
  assert.equal(response.cookies.get(CSRF_COOKIE).maxAge, 0);
});

test("CSRF tokens vary, stay out of cache, and use a secure cookie in production", async () => {
  const a = issueCsrf();
  const b = issueCsrf();
  assert.notEqual((await a.json()).csrfToken, (await b.json()).csrfToken);
  assert.equal(a.headers.get("cache-control"), "no-store");
  process.env.NODE_ENV = "production";
  try {
    assert.equal(issueCsrf().cookies.get(CSRF_COOKIE).secure, true);
  } finally {
    process.env.NODE_ENV = "test";
  }
});
