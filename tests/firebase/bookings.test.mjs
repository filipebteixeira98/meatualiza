import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, beforeEach, test } from "node:test";
import { deleteApp, getApps } from "firebase/app";
import {
  GoogleAuthProvider,
  signInWithCredential,
  signOut,
} from "firebase/auth";
import {
  deleteApp as deleteAdminApp,
  getApps as getAdminApps,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getAdminApp } from "../../src/lib/firebase/admin.ts";
import { getBrowserAuth } from "../../src/lib/firebase/client.ts";
import { createStudentSession } from "../../src/lib/auth/session.ts";
import {
  BookingError,
  changeBooking,
  getAgenda,
} from "../../src/lib/bookings.ts";
import { upcomingSessions } from "../../src/lib/schedule.ts";

assert.equal(process.env.GCLOUD_PROJECT, "demo-meatualiza");
assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, "127.0.0.1:9099");
assert.equal(process.env.FIRESTORE_EMULATOR_HOST, "127.0.0.1:8080");
Object.assign(process.env, {
  NODE_ENV: "test",
  FIREBASE_PROJECT_ID: "demo-meatualiza",
  NEXT_PUBLIC_FIREBASE_API_KEY: "demo-api-key",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "demo-meatualiza.firebaseapp.com",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-meatualiza",
  NEXT_PUBLIC_FIREBASE_APP_ID: "demo-app-id",
  NEXT_PUBLIC_FIREBASE_USE_EMULATORS: "true",
});
const doubt = {
  topicId: "repeticao",
  description: "Como atualizar o contador?",
};
let database;
let students;
let monitor;
let dates;
const referenceTime = Date.parse("2026-10-22T13:00:00-03:00");
let clock = () => referenceTime;

async function account(isMonitor = false) {
  const sub = randomUUID();
  const { user } = await signInWithCredential(
    getBrowserAuth(),
    GoogleAuthProvider.credential(
      JSON.stringify({
        sub,
        email: `${sub}@example.test`,
        email_verified: true,
        name: "Aluno Agenda",
      }),
    ),
  );
  if (isMonitor)
    await getAuth(getAdminApp()).setCustomUserClaims(user.uid, {
      monitor: true,
    });
  const cookie = await createStudentSession(await user.getIdToken(isMonitor));
  await signOut(getBrowserAuth());
  return { uid: user.uid, cookie };
}
const command = (sessionId, extra = {}) => ({
  type: "book",
  sessionId,
  expectedVersion: 0,
  helpRequest: doubt,
  ...extra,
});
const execute = (user, input, operationId = randomUUID()) =>
  changeBooking(user?.cookie, input, operationId, () => clock());
const state = async (id) => (await database.doc(`sessions/${id}`).get()).data();
const own = async (id, user = students[0]) =>
  (await database.doc(`sessions/${id}/registrations/${user.uid}`).get()).data();
async function fill(id, users) {
  for (const user of users) await execute(user, command(id));
}

before(async () => {
  database = getFirestore(getAdminApp());
  dates = upcomingSessions(referenceTime).map(({ id }) => id);
  assert.ok(
    dates.length >= 3,
    "Os testes integrados exigem ao menos três sessões futuras no período aprovado.",
  );
  students = [];
  for (let i = 0; i < 13; i++) students.push(await account());
  monitor = await account(true);
});
beforeEach(async () => {
  clock = () => referenceTime;
  await database.recursiveDelete(database.collection("sessions"));
});
after(async () => {
  await Promise.all([
    ...getApps().map(deleteApp),
    ...getAdminApps().map(deleteAdminApp),
  ]);
});

test("consulta não cria sessões e cada aluno recebe apenas a própria dúvida", async () => {
  const agenda = await getAgenda(students[0].cookie, referenceTime);
  assert.equal(agenda.sessions[0].enrolledCount, 0);
  assert.equal((await database.collection("sessions").get()).empty, true);
  await execute(students[0], command(dates[0]));
  const other = await getAgenda(students[1].cookie, referenceTime);
  assert.equal(other.sessions[0].enrolledCount, 1);
  assert.equal(other.sessions[0].registration, null);
  const ownAgenda = await getAgenda(students[0].cookie, referenceTime);
  assert.deepEqual(ownAgenda.sessions[0].registration.helpRequest, doubt);
  assert.equal(
    JSON.stringify(await getAgenda(monitor.cookie, referenceTime)).includes(
      doubt.description,
    ),
    false,
  );
});

test("após o término, a agenda fica vazia sem criar novas sessões", async () => {
  const agenda = await getAgenda(
    students[0].cookie,
    Date.parse("2026-12-12T00:00:00-03:00"),
  );
  assert.deepEqual(agenda.sessions, []);
  assert.equal((await database.collection("sessions").get()).empty, true);
});

test("sessão, identidade e dados inválidos nunca criam uma inscrição", async () => {
  for (const [user, input] of [
    [null, command(dates[0])],
    [monitor, command(dates[0])],
    [students[0], command(dates[0], { uid: students[1].uid })],
    [students[0], command("2026-10-27")],
    [
      students[0],
      command(dates[0], { helpRequest: { ...doubt, description: "   " } }),
    ],
    [
      students[0],
      { type: "cancel-session", sessionId: dates[0], reason: "Forjado" },
    ],
  ])
    await assert.rejects(execute(user, input), BookingError);
  await assert.rejects(
    execute(students[0], command(dates[0]), "inválido"),
    BookingError,
  );
  assert.equal((await database.collection("sessions").get()).empty, true);
  assert.equal(await getAgenda(), null);
});

test("repetições simultâneas do mesmo pedido ocupam uma única vaga", async () => {
  const operation = randomUUID();
  await Promise.all(
    Array.from({ length: 4 }, () =>
      execute(students[0], command(dates[0]), operation),
    ),
  );
  assert.equal((await state(dates[0])).enrolledCount, 1);
  assert.equal((await own(dates[0])).version, 1);
  assert.equal(
    (await database.collection(`sessions/${dates[0]}/registrations`).get())
      .size,
    1,
  );
});

test("disputa pela décima vaga confirma só um aluno e não cria pedidos órfãos", async () => {
  await fill(dates[0], students.slice(0, 9));
  const results = await Promise.allSettled(
    students.slice(9, 12).map((student) => execute(student, command(dates[0]))),
  );
  assert.equal(
    results.filter(({ status }) => status === "fulfilled").length,
    1,
  );
  assert.equal((await state(dates[0])).enrolledCount, 10);
  const rows = await database
    .collection(`sessions/${dates[0]}/registrations`)
    .get();
  assert.equal(rows.size, 10);
  for (const row of rows.docs) assert.deepEqual(row.data().helpRequest, doubt);
});

test("edição preserva a vaga e cancelamento a libera, mantendo histórico", async () => {
  await fill(dates[0], students.slice(0, 10));
  await execute(
    students[0],
    command(dates[0], {
      type: "edit",
      expectedVersion: 1,
      helpRequest: { ...doubt, description: "Dúvida editada" },
    }),
  );
  assert.equal((await state(dates[0])).enrolledCount, 10);
  assert.equal((await own(dates[0])).helpRequest.description, "Dúvida editada");
  await execute(students[0], {
    type: "cancel",
    sessionId: dates[0],
    expectedVersion: 2,
  });
  assert.equal((await state(dates[0])).enrolledCount, 9);
  await execute(students[10], command(dates[0]));
  assert.equal((await state(dates[0])).enrolledCount, 10);
  assert.equal((await own(dates[0])).status, "cancelled");
  assert.equal(
    (
      await database
        .collection(
          `sessions/${dates[0]}/registrations/${students[0].uid}/history`,
        )
        .get()
    ).size,
    3,
  );
});

test("troca é atômica, leva a dúvida e aceita repetição após perda da resposta", async () => {
  await execute(students[0], command(dates[0]));
  const move = {
    type: "move",
    sessionId: dates[0],
    targetSessionId: dates[1],
    expectedVersion: 1,
  };
  const operation = randomUUID();
  await execute(students[0], move, operation);
  await execute(students[0], move, operation);
  assert.equal((await state(dates[0])).enrolledCount, 0);
  assert.equal((await state(dates[1])).enrolledCount, 1);
  assert.equal((await own(dates[0])).status, "cancelled");
  assert.deepEqual((await own(dates[1])).helpRequest, doubt);
});

test("trocar para uma inscrição antes cancelada preserva criação e histórico", async () => {
  await execute(students[0], command(dates[1]));
  const createdAt = (await own(dates[1])).createdAt;
  await execute(students[0], {
    type: "cancel",
    sessionId: dates[1],
    expectedVersion: 1,
  });
  await execute(students[0], command(dates[0]));
  await execute(students[0], {
    type: "move",
    sessionId: dates[0],
    targetSessionId: dates[1],
    expectedVersion: 1,
  });
  const saved = await own(dates[1]);
  assert.equal(saved.createdAt.isEqual(createdAt), true);
  assert.equal(saved.status, "confirmed");
  assert.equal(saved.version, 3);
});

test("destino lotado ou cancelado preserva a inscrição anterior", async () => {
  await execute(students[0], command(dates[0]));
  await fill(dates[1], students.slice(1, 11));
  await execute(monitor, {
    type: "cancel-session",
    sessionId: dates[2],
    reason: "Laboratório indisponível",
  });
  for (const targetSessionId of [dates[1], dates[2], dates[0], "2026-10-27"])
    await assert.rejects(
      execute(students[0], {
        type: "move",
        sessionId: dates[0],
        targetSessionId,
        expectedVersion: 1,
      }),
      BookingError,
    );
  assert.equal((await own(dates[0])).status, "confirmed");
  assert.equal((await state(dates[0])).enrolledCount, 1);
  assert.equal((await state(dates[1])).enrolledCount, 10);
});

test("monitor cancela todas as inscrições com motivo e bloqueia nova entrada", async () => {
  await fill(dates[0], students.slice(0, 3));
  const cancel = {
    type: "cancel-session",
    sessionId: dates[0],
    reason: "Manutenção no L7",
  };
  const operation = randomUUID();
  await execute(monitor, cancel, operation);
  await execute(monitor, cancel, operation);
  assert.equal((await state(dates[0])).enrolledCount, 0);
  for (const student of students.slice(0, 3)) {
    const saved = await own(dates[0], student);
    assert.equal(saved.status, "cancelled");
    assert.equal(saved.cancellationReason, cancel.reason);
  }
  await assert.rejects(execute(students[3], command(dates[0])), BookingError);
  const visible = (await getAgenda(students[0].cookie, referenceTime))
    .sessions[0];
  assert.equal(visible.status, "cancelled");
  assert.equal(visible.cancellationReason, cancel.reason);
});

test("cancelar sessão em disputa com inscrição deixa zero participantes ativos", async () => {
  await Promise.allSettled([
    execute(students[0], command(dates[0])),
    execute(monitor, {
      type: "cancel-session",
      sessionId: dates[0],
      reason: "Bloqueio",
    }),
  ]);
  assert.equal((await state(dates[0])).status, "cancelled");
  assert.equal((await state(dates[0])).enrolledCount, 0);
  assert.equal(
    (
      await database
        .collection(`sessions/${dates[0]}/registrations`)
        .where("status", "==", "confirmed")
        .get()
    ).size,
    0,
  );
});

test("versão antiga e identificador reutilizado não sobrescrevem outra tentativa", async () => {
  const operation = randomUUID();
  await execute(students[0], command(dates[0]), operation);
  await assert.rejects(
    execute(
      students[0],
      command(dates[0], {
        helpRequest: { ...doubt, description: "Outro texto" },
      }),
      operation,
    ),
    BookingError,
  );
  const cancel = { type: "cancel", sessionId: dates[0], expectedVersion: 1 };
  const cancelOperation = randomUUID();
  await execute(students[0], cancel, cancelOperation);
  await execute(students[0], command(dates[0], { expectedVersion: 2 }));
  await assert.rejects(
    execute(students[0], cancel, cancelOperation),
    BookingError,
  );
  assert.equal((await own(dates[0])).status, "confirmed");
  assert.equal((await state(dates[0])).enrolledCount, 1);
});

test("no início do encontro, inscrição, edição, cancelamento e troca encerram", async () => {
  await execute(students[0], command(dates[0]));
  const start = Date.parse(upcomingSessions(referenceTime)[0].startsAt);
  clock = () => start;
  for (const input of [
    command(dates[0]),
    command(dates[0], { type: "edit", expectedVersion: 1 }),
    { type: "cancel", sessionId: dates[0], expectedVersion: 1 },
    {
      type: "move",
      sessionId: dates[0],
      targetSessionId: dates[1],
      expectedVersion: 1,
    },
  ])
    await assert.rejects(execute(students[0], input), BookingError);
  assert.equal((await own(dates[0])).status, "confirmed");
  assert.equal((await state(dates[0])).enrolledCount, 1);
});
