import "server-only";

import { getFirestore } from "firebase-admin/firestore";
import { getAccountProfile } from "./auth/session.ts";
import { getAdminApp } from "./firebase/admin.ts";

export type TourStatus = "skipped" | "completed";

export async function saveTourStatus(
  cookie: string | undefined,
  expectedRole: unknown,
  status: unknown,
) {
  if (status !== "skipped" && status !== "completed") return false;
  const profile = await getAccountProfile(cookie);
  if (!profile || profile.role !== expectedRole) return false;

  const database = getFirestore(getAdminApp());
  const reference = database.collection("users").doc(profile.uid);
  const field = `tour.${profile.role}`;
  return database.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) return false;
    const current = snapshot.get(field);
    // A skip from another tab must not undo a completed tour.
    if (current !== "completed" && current !== status) {
      transaction.update(reference, { [field]: status });
    }
    return true;
  });
}
