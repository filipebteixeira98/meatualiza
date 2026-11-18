import assert from "node:assert/strict";
import { test } from "node:test";
import { summarizeMonitorSessions } from "../../src/lib/monitor-dashboard.ts";
import { sessionDetails } from "../../src/lib/schedule.ts";

const now = Date.parse("2026-11-18T13:00:00-03:00");
const registration = (attendance = "unrecorded", topicId = "repeticao") => ({
  studentId: "student",
  displayName: "Aluno",
  version: 1,
  attendance,
  helpRequest: { topicId, description: "Minha dúvida" },
});
const session = (id, status, registrations = []) => ({
  ...sessionDetails(id),
  status,
  registrations,
  enrolledCount: registrations.length,
  cancellationReason: null,
  registration: null,
});

test("métricas separam previsão, realização e comparecimento sem inferir faltas", () => {
  const summary = summarizeMonitorSessions(
    [
      session("2026-11-16", "completed", [
        registration("present"),
        registration("absent"),
        registration(),
      ]),
      session("2026-11-18", "scheduled", [registration()]),
      session(
        "2026-11-23",
        "scheduled",
        Array.from({ length: 8 }, () => registration()),
      ),
      session("2026-11-25", "scheduled", []),
      session("2026-11-30", "cancelled", []),
      session("2026-11-11", "cancelled", [registration("present")]),
    ],
    now,
  );
  assert.equal(summary.expected, 8);
  assert.equal(summary.upcoming.length, 2);
  assert.equal(summary.occupancy, 40);
  assert.equal(summary.completed, 1);
  assert.equal(summary.present, 1);
  assert.equal(summary.absent, 1);
  assert.equal(summary.unrecorded, 2);
  assert.deepEqual(
    summary.topics.map(({ id, count }) => ({ id, count })),
    [{ id: "repeticao", count: 8 }],
  );
});

test("ocupação usa capacidade real e retorna zero sem sessões", () => {
  for (const [count, expected] of [
    [0, 0],
    [8, 80],
    [10, 100],
  ]) {
    const summary = summarizeMonitorSessions(
      [
        session(
          "2026-11-23",
          "scheduled",
          Array.from({ length: count }, () => registration()),
        ),
      ],
      now,
    );
    assert.equal(summary.occupancy, expected);
  }
  const empty = summarizeMonitorSessions([], now);
  assert.equal(empty.occupancy, 0);
  assert.equal(empty.completed, 0);
  assert.deepEqual(empty.topics, []);
});
