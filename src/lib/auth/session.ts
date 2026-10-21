import "server-only";

import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getAdminApp } from "../firebase/admin.ts";

export const SESSION_COOKIE = "meatualiza_session";
export const SESSION_MAX_AGE = 5 * 24 * 60 * 60;

export class InvalidSessionError extends Error {}

export function isInvalidSession(error: unknown) {
  if (error instanceof InvalidSessionError) return true;
  if (!error || typeof error !== "object" || !("code" in error)) return false;
  return [
    "auth/argument-error",
    "auth/invalid-id-token",
    "auth/id-token-expired",
    "auth/id-token-revoked",
    "auth/invalid-session-cookie",
    "auth/session-cookie-expired",
    "auth/session-cookie-revoked",
    "auth/user-disabled",
    "auth/user-not-found",
  ].includes(String(error.code));
}

function googleIdentity(claims: DecodedIdToken) {
  if (
    claims.firebase?.sign_in_provider !== "google.com" ||
    !claims.uid ||
    claims.uid.includes("/") ||
    typeof claims.email !== "string" ||
    !claims.email.trim()
  ) {
    throw new InvalidSessionError("Identidade Google inválida.");
  }
  return {
    uid: claims.uid,
    email: claims.email,
    displayName:
      typeof claims.name === "string" && claims.name.trim()
        ? claims.name.trim()
        : claims.email,
  };
}

export async function createStudentSession(idToken: string) {
  const app = getAdminApp();
  const auth = getAuth(app);
  const claims = await auth.verifyIdToken(idToken, true);
  const identity = googleIdentity(claims);
  const age = Math.floor(Date.now() / 1000) - claims.auth_time;
  if (!Number.isFinite(age) || age < 0 || age >= 5 * 60) {
    throw new InvalidSessionError("Entre novamente com Google.");
  }

  const cookie = await auth.createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE * 1000,
  });
  const database = getFirestore(app);
  const reference = database.collection("users").doc(identity.uid);
  await database.runTransaction(async (transaction) => {
    const existing = await transaction.get(reference);
    transaction.set(
      reference,
      {
        displayName: identity.displayName,
        email: identity.email,
        ...(!existing.exists
          ? { createdAt: FieldValue.serverTimestamp() }
          : {}),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });
  return cookie;
}

export async function getStudentProfile(cookie?: string) {
  if (!cookie || cookie.length > 8192) return null;
  const app = getAdminApp();
  let identity;
  try {
    identity = googleIdentity(
      await getAuth(app).verifySessionCookie(cookie, true),
    );
  } catch (error) {
    if (isInvalidSession(error)) return null;
    throw error;
  }
  const snapshot = await getFirestore(app)
    .collection("users")
    .doc(identity.uid)
    .get();
  const profile = snapshot.data();
  if (
    !profile ||
    typeof profile.displayName !== "string" ||
    typeof profile.email !== "string"
  ) {
    return null;
  }
  return {
    uid: identity.uid,
    displayName: profile.displayName,
    email: profile.email,
  };
}
