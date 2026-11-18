import assert from "node:assert/strict";
import { test } from "node:test";
import {
  evaluationSchema,
  summarizeEvaluations,
} from "../../src/lib/evaluations.ts";

test("avaliação aceita os três resultados e comentário opcional limitado", () => {
  for (const resolution of ["resolved", "partial", "unresolved"])
    assert.deepEqual(evaluationSchema.parse({ resolution }), {
      resolution,
      comment: "",
    });
  assert.equal(
    evaluationSchema.parse({
      resolution: "partial",
      comment: "  Avancei no algoritmo.\nObrigado!  ",
    }).comment,
    "Avancei no algoritmo.\nObrigado!",
  );
  assert.equal(
    evaluationSchema.safeParse({
      resolution: "resolved",
      comment: "a".repeat(1000),
    }).success,
    true,
  );
  for (const value of [
    {},
    { resolution: "pending" },
    { resolution: "resolved", comment: "a".repeat(1001) },
    { resolution: "resolved", comment: null },
    { resolution: "resolved", studentId: "other" },
  ])
    assert.equal(evaluationSchema.safeParse(value).success, false);
});

test("contagens distinguem respostas, pendências e comparecimento sem inferir resolução", () => {
  const registration = (attendance, evaluation = null) => ({
    attendance,
    evaluation,
  });
  const registrations = [
    registration("present"),
    registration("absent"),
    registration("unrecorded"),
    registration("present", { resolution: "resolved" }),
    registration("present", { resolution: "partial" }),
    registration("absent", { resolution: "unresolved" }),
  ];
  const summary = summarizeEvaluations([
    { id: "2026-11-16", status: "completed", registrations },
    { id: "2026-11-18", status: "scheduled", registrations },
    { id: "2026-11-11", status: "cancelled", registrations },
    {
      id: "2026-11-09",
      status: "completed",
      registration: { status: "cancelled", attendance: "present" },
    },
  ]);
  assert.equal(summary.pending.length, 1);
  assert.equal(summary.responded.length, 3);
  assert.deepEqual(
    summary.results.map(({ count }) => count),
    [1, 1, 1],
  );
  assert.equal(summarizeEvaluations([]).pending.length, 0);
});
