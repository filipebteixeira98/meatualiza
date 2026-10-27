import assert from "node:assert/strict";
import { test } from "node:test";
import {
  bookingChangeSchema,
  isOpenForBooking,
  sessionDetails,
  upcomingSessions,
} from "../../src/lib/schedule.ts";

test("sessões de segunda/quarta duram uma hora no horário da Bahia", () => {
  const sessions = upcomingSessions(Date.parse("2026-10-22T13:00:00-03:00"));
  assert.deepEqual(
    sessions.map(({ id }) => id),
    [
      "2026-10-26",
      "2026-10-28",
      "2026-11-02",
      "2026-11-04",
      "2026-11-09",
      "2026-11-11",
      "2026-11-16",
      "2026-11-18",
    ],
  );
  for (const item of sessions) {
    assert.equal(item.startsAt.slice(11), "14:30:00.000Z");
    assert.equal(
      Date.parse(item.endsAt) - Date.parse(item.startsAt),
      3_600_000,
    );
  }
});

test("a janela móvel é de 28 dias e encerra exatamente no início", () => {
  const start = Date.parse("2026-10-26T11:30:00-03:00");
  assert.equal(isOpenForBooking("2026-10-26", start - 1), true);
  assert.equal(isOpenForBooking("2026-10-26", start), false);
  assert.equal(isOpenForBooking("2026-10-26", start - 28 * 86_400_000), false);
  assert.equal(
    isOpenForBooking("2026-10-26", start - 28 * 86_400_000 + 1),
    true,
  );
});

test("a troca de data usa America/Bahia, sem depender do fuso da máquina", () => {
  const sessions = upcomingSessions(Date.parse("2026-10-26T01:00:00Z"));
  assert.equal(sessions[0].id, "2026-10-26");
});

test("a última sessão regular é 9/12 e o término não gera horários extras", () => {
  assert.deepEqual(
    upcomingSessions(Date.parse("2026-12-07T10:00:00-03:00")).map(
      ({ id }) => id,
    ),
    ["2026-12-07", "2026-12-09"],
  );
  assert.deepEqual(
    upcomingSessions(Date.parse("2026-12-09T11:30:00-03:00")),
    [],
  );
  assert.deepEqual(
    upcomingSessions(Date.parse("2026-12-12T00:00:00-03:00")),
    [],
  );
});

test("datas inexistentes, fora da recorrência e posteriores ao término são inválidas", () => {
  for (const id of [
    "2026-02-30",
    "2026-10-27",
    "2026-12-14",
    "2026-1-26",
    "../users",
    "2026-10-26/uid",
  ])
    assert.equal(sessionDetails(id), null);
});

test("o comando recusa identidade, estados, campos extras e falta de versão", () => {
  const command = {
    type: "book",
    sessionId: "2026-10-26",
    expectedVersion: 0,
    helpRequest: { topicId: "outro", description: "Como começar?" },
  };
  assert.equal(bookingChangeSchema.safeParse(command).success, true);
  for (const key of ["uid", "role", "status", "enrolledCount"])
    assert.equal(
      bookingChangeSchema.safeParse({ ...command, [key]: "forjado" }).success,
      false,
    );
  assert.equal(
    bookingChangeSchema.safeParse({ ...command, expectedVersion: undefined })
      .success,
    false,
  );
  assert.equal(
    bookingChangeSchema.safeParse({ ...command, expectedVersion: -1 }).success,
    false,
  );
});
