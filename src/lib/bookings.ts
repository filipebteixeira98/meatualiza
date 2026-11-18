import "server-only";

import { createHash } from "node:crypto";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { z } from "zod";
import { getAccountProfile } from "./auth/session.ts";
import { getAdminApp } from "./firebase/admin.ts";
import { helpRequestSchema } from "./help-request.ts";
import { monitoria } from "./monitoria.ts";
import {
  bookingChangeSchema,
  attendanceSchema,
  isOpenForBooking,
  sessionDetails,
  upcomingSessions,
  type SessionView,
} from "./schedule.ts";

export class BookingError extends Error {}

const sessionState = z.object({
  status: z.enum(["scheduled", "completed", "cancelled"]),
  enrolledCount: z.int().min(0).max(monitoria.capacidade),
  cancellationReason: z.string().nullable(),
  lastOperationId: z.string().optional(),
  lastOperationHash: z.string().optional(),
});
const registrationState = z.object({
  status: z.enum(["confirmed", "cancelled"]),
  helpRequest: helpRequestSchema,
  version: z.int().positive(),
  cancellationReason: z.string().nullable(),
  lastOperationId: z.string(),
  lastOperationHash: z.string(),
  attendance: attendanceSchema.default("unrecorded"),
});
const emptySession: z.infer<typeof sessionState> = {
  status: "scheduled",
  enrolledCount: 0,
  cancellationReason: null,
};

export async function getAgenda(
  cookie?: string,
  now = Date.now(),
  includeHistory = false,
) {
  const profile = await getAccountProfile(cookie);
  if (!profile) return null;
  const database = getFirestore(getAdminApp());
  return database.runTransaction(
    async (transaction) => {
      const details = upcomingSessions(now);
      if (profile.role === "monitor" && includeHistory) {
        const recent = await transaction.get(
          database
            .collection("sessions")
            .where(
              "startsAt",
              ">=",
              new Date(now - 28 * 86_400_000).toISOString(),
            )
            .where("startsAt", "<=", new Date(now).toISOString()),
        );
        details.unshift(
          ...recent.docs
            .flatMap((row) => {
              const detail = sessionDetails(row.id);
              return detail ? [detail] : [];
            })
            .sort((a, b) => a.id.localeCompare(b.id)),
        );
      }
      if (!details.length)
        return {
          role: profile.role,
          sessions: [] as SessionView[],
          receivedRequests: 0,
          asOf: now,
        };
      const references = details.map(({ id }) =>
        database.collection("sessions").doc(id),
      );
      const snapshots = await transaction.getAll(...references);
      const own =
        profile.role === "student"
          ? await transaction.getAll(
              ...references.map((reference) =>
                reference.collection("registrations").doc(profile.uid),
              ),
            )
          : [];
      const registrations =
        profile.role === "monitor"
          ? await Promise.all(
              references.map((reference) =>
                transaction.get(reference.collection("registrations")),
              ),
            )
          : [];
      const studentIds = [
        ...new Set(
          registrations.flatMap((snapshot) =>
            snapshot.docs
              .filter((row) => row.get("status") === "confirmed")
              .map((row) => row.id),
          ),
        ),
      ];
      const students = studentIds.length
        ? await transaction.getAll(
            ...studentIds.map((id) => database.collection("users").doc(id)),
          )
        : [];
      const names = new Map(
        students.map((student) => {
          const name = student.get("displayName");
          return [
            student.id,
            typeof name === "string" && name.trim()
              ? name.trim()
              : "Aluno sem nome",
          ];
        }),
      );
      const sessions: SessionView[] = details.map((detail, i) => {
        const state = snapshots[i].exists
          ? sessionState.parse(snapshots[i].data())
          : emptySession;
        const saved = own[i]?.exists
          ? registrationState.parse(own[i].data())
          : null;
        return {
          ...detail,
          status: state.status,
          enrolledCount: state.enrolledCount,
          cancellationReason: state.cancellationReason,
          registration: saved
            ? {
                status: saved.status,
                helpRequest: saved.helpRequest,
                version: saved.version,
                cancellationReason: saved.cancellationReason,
                attendance: saved.attendance,
              }
            : null,
          ...(profile.role === "monitor"
            ? {
                registrations: registrations[i].docs
                  .filter((row) => row.get("status") === "confirmed")
                  .map((row) => {
                    const saved = registrationState.parse(row.data());
                    return {
                      studentId: row.id,
                      displayName: names.get(row.id) ?? "Aluno sem nome",
                      helpRequest: saved.helpRequest,
                      version: saved.version,
                      attendance: saved.attendance,
                    };
                  })
                  .sort(
                    (a, b) =>
                      a.displayName.localeCompare(b.displayName, "pt-BR") ||
                      a.studentId.localeCompare(b.studentId),
                  ),
              }
            : {}),
        };
      });
      const receivedRequests = registrations.reduce(
        (total, snapshot) =>
          total +
          snapshot.docs.filter((row) => {
            const createdAt = row.get("createdAt")?.toMillis();
            return createdAt >= now - 28 * 86_400_000 && createdAt <= now;
          }).length,
        0,
      );
      return { role: profile.role, sessions, receivedRequests, asOf: now };
    },
    { readOnly: true },
  );
}

export async function changeBooking(
  cookie: string | undefined,
  input: unknown,
  operationId: unknown,
  clock = Date.now,
) {
  const profile = await getAccountProfile(cookie);
  if (!profile) throw new BookingError("Sua sessão expirou. Entre novamente.");
  const parsed = bookingChangeSchema.safeParse(input);
  const operation = z.uuid().safeParse(operationId);
  if (!parsed.success || !operation.success)
    throw new BookingError("Confira os dados da solicitação.");
  const command = parsed.data;
  const monitorCommand = [
    "cancel-session",
    "complete-session",
    "attendance",
  ].includes(command.type);
  if (monitorCommand !== (profile.role === "monitor"))
    throw new BookingError("Sua conta não pode realizar esta operação.");
  const details = sessionDetails(command.sessionId);
  if (!details) throw new BookingError("Sessão inválida.");
  const database = getFirestore(getAdminApp());
  const reference = database.collection("sessions").doc(command.sessionId);
  const ownReference = reference
    .collection("registrations")
    .doc(command.type === "attendance" ? command.studentId : profile.uid);
  const hash = createHash("sha256")
    .update(JSON.stringify(command))
    .digest("hex");
  const operationFields = {
    lastOperationId: operation.data,
    lastOperationHash: hash,
  };

  await database.runTransaction(async (transaction) => {
    const sessionSnapshot = await transaction.get(reference);
    const state = sessionSnapshot.exists
      ? sessionState.parse(sessionSnapshot.data())
      : emptySession;
    const ownSnapshot =
      command.type !== "cancel-session" && command.type !== "complete-session"
        ? await transaction.get(ownReference)
        : null;
    const own = ownSnapshot?.exists
      ? registrationState.parse(ownSnapshot.data())
      : null;
    const previousOperation =
      command.type === "cancel-session" || command.type === "complete-session"
        ? state
        : own;
    if (previousOperation?.lastOperationId === operation.data) {
      if (previousOperation.lastOperationHash !== hash)
        throw new BookingError(
          "Esta tentativa já foi utilizada. Atualize a agenda.",
        );
      return;
    }

    if (command.type === "complete-session") {
      if (
        !sessionSnapshot.exists ||
        state.status !== "scheduled" ||
        clock() < Date.parse(details.endsAt)
      )
        throw new BookingError(
          "A sessão precisa ter terminado e estar agendada para registrar sua realização.",
        );
      const stamp = FieldValue.serverTimestamp();
      transaction.update(reference, {
        status: "completed",
        completedAt: stamp,
        completedBy: profile.uid,
        updatedAt: stamp,
        ...operationFields,
      });
      transaction.create(reference.collection("history").doc(operation.data), {
        type: "completed",
        by: profile.uid,
        at: stamp,
      });
      return;
    }

    if (command.type === "attendance") {
      if (
        !sessionSnapshot.exists ||
        !own ||
        own.status !== "confirmed" ||
        state.status === "cancelled" ||
        clock() < Date.parse(details.startsAt)
      )
        throw new BookingError(
          "Registre o comparecimento de um aluno inscrito após o início de uma sessão válida.",
        );
      if (own.version !== command.expectedVersion)
        throw new BookingError(
          "O registro mudou. Atualize a agenda antes de continuar.",
        );
      const stamp = FieldValue.serverTimestamp();
      transaction.update(ownReference, {
        attendance: command.attendance,
        attendanceRecordedAt: stamp,
        attendanceRecordedBy: profile.uid,
        version: own.version + 1,
        updatedAt: stamp,
        ...operationFields,
      });
      transaction.create(
        ownReference.collection("history").doc(operation.data),
        {
          type: "attendance",
          attendance: command.attendance,
          by: profile.uid,
          at: stamp,
        },
      );
      return;
    }

    if (command.type === "cancel-session") {
      if (state.status !== "scheduled")
        throw new BookingError("Esta sessão já foi encerrada ou cancelada.");
      if (
        !sessionSnapshot.exists &&
        !isOpenForBooking(command.sessionId, clock())
      )
        throw new BookingError("Esta data não está disponível na agenda.");
      const active = await transaction.get(
        reference
          .collection("registrations")
          .where("status", "==", "confirmed"),
      );
      if (active.size !== state.enrolledCount)
        throw new Error("Contagem de inscrições inconsistente.");
      const stamp = FieldValue.serverTimestamp();
      transaction.set(
        reference,
        {
          ...details,
          status: "cancelled",
          enrolledCount: 0,
          cancellationReason: command.reason,
          updatedAt: stamp,
          ...operationFields,
        },
        { merge: true },
      );
      for (const row of active.docs) {
        const saved = registrationState.parse(row.data());
        transaction.update(row.ref, {
          status: "cancelled",
          version: saved.version + 1,
          cancellationReason: command.reason,
          updatedAt: stamp,
          ...operationFields,
        });
        transaction.create(row.ref.collection("history").doc(operation.data), {
          type: "session-cancelled",
          reason: command.reason,
          at: stamp,
        });
      }
      return;
    }

    if ((own?.version ?? 0) !== command.expectedVersion)
      throw new BookingError(
        "Sua inscrição mudou em outra tentativa. Atualize a agenda antes de continuar.",
      );
    if (state.status !== "scheduled" || clock() >= Date.parse(details.startsAt))
      throw new BookingError(
        "Esta sessão foi cancelada, encerrada ou já começou.",
      );
    if (command.type !== "book" && own?.status !== "confirmed")
      throw new BookingError("Não há inscrição ativa nesta sessão.");
    if (command.type === "book" && own?.status === "confirmed")
      throw new BookingError(
        "Você já está inscrito. Use a opção de editar a dúvida.",
      );

    let target: {
      reference: typeof reference;
      details: NonNullable<ReturnType<typeof sessionDetails>>;
      state: z.infer<typeof sessionState>;
      registration: z.infer<typeof registrationState> | null;
      createdAt: unknown;
    } | null = null;
    if (command.type === "move") {
      const targetDetails = sessionDetails(command.targetSessionId);
      if (!targetDetails || command.targetSessionId === command.sessionId)
        throw new BookingError("Escolha outra sessão.");
      const targetReference = database
        .collection("sessions")
        .doc(command.targetSessionId);
      const [targetSnapshot, targetOwn] = await transaction.getAll(
        targetReference,
        targetReference.collection("registrations").doc(profile.uid),
      );
      const targetState = targetSnapshot.exists
        ? sessionState.parse(targetSnapshot.data())
        : emptySession;
      const targetRegistration = targetOwn.exists
        ? registrationState.parse(targetOwn.data())
        : null;
      if (
        !isOpenForBooking(command.targetSessionId, clock()) ||
        targetState.status !== "scheduled" ||
        targetState.enrolledCount >= monitoria.capacidade ||
        targetRegistration?.status === "confirmed"
      )
        throw new BookingError(
          "A sessão de destino está indisponível. Sua inscrição anterior foi mantida.",
        );
      target = {
        reference: targetReference,
        details: targetDetails,
        state: targetState,
        registration: targetRegistration,
        createdAt: targetOwn.get("createdAt"),
      };
    }
    // Revalidar após as leituras, inclusive em cada repetição da transação.
    const now = clock();
    if (
      now >= Date.parse(details.startsAt) ||
      (command.type === "book" && !isOpenForBooking(command.sessionId, now)) ||
      (target && !isOpenForBooking(target.details.id, now))
    )
      throw new BookingError(
        "O prazo desta operação terminou. Atualize a agenda.",
      );
    if (command.type === "book" && state.enrolledCount >= monitoria.capacidade)
      throw new BookingError(
        "Esta sessão está lotada. Escolha outro encontro.",
      );
    const stamp = FieldValue.serverTimestamp();
    const nextVersion = (own?.version ?? 0) + 1;
    if (command.type === "book") {
      transaction.set(
        reference,
        {
          ...details,
          ...state,
          enrolledCount: state.enrolledCount + 1,
          updatedAt: stamp,
        },
        { merge: true },
      );
      transaction.set(ownReference, {
        studentId: profile.uid,
        status: "confirmed",
        helpRequest: command.helpRequest,
        version: nextVersion,
        cancellationReason: null,
        createdAt: ownSnapshot?.get("createdAt") ?? stamp,
        updatedAt: stamp,
        ...operationFields,
      });
    } else if (command.type === "edit") {
      transaction.update(ownReference, {
        helpRequest: command.helpRequest,
        version: nextVersion,
        updatedAt: stamp,
        ...operationFields,
      });
    } else {
      if (state.enrolledCount < 1)
        throw new Error("Contagem de inscrições inconsistente.");
      const reason =
        command.type === "move"
          ? `Inscrição transferida para ${command.targetSessionId}.`
          : "Cancelada pelo aluno.";
      transaction.update(reference, {
        enrolledCount: state.enrolledCount - 1,
        updatedAt: stamp,
      });
      transaction.update(ownReference, {
        status: "cancelled",
        version: nextVersion,
        cancellationReason: reason,
        updatedAt: stamp,
        ...operationFields,
      });
      if (target && own) {
        transaction.set(
          target.reference,
          {
            ...target.details,
            ...target.state,
            enrolledCount: target.state.enrolledCount + 1,
            updatedAt: stamp,
          },
          { merge: true },
        );
        const targetOwn = target.reference
          .collection("registrations")
          .doc(profile.uid);
        transaction.set(targetOwn, {
          studentId: profile.uid,
          status: "confirmed",
          helpRequest: own.helpRequest,
          version: (target.registration?.version ?? 0) + 1,
          cancellationReason: null,
          createdAt: target.createdAt ?? stamp,
          updatedAt: stamp,
          ...operationFields,
        });
        transaction.create(
          targetOwn.collection("history").doc(operation.data),
          { type: "moved-in", from: command.sessionId, at: stamp },
        );
      }
    }
    transaction.create(ownReference.collection("history").doc(operation.data), {
      type: command.type,
      ...(command.type === "move" ? { target: command.targetSessionId } : {}),
      at: stamp,
    });
  });
}
