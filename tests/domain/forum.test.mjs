import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import {
  forumChangeSchema,
  topicContentSchema,
  FORUM_BODY_MAX_LENGTH,
  FORUM_REASON_MAX_LENGTH,
  FORUM_TITLE_MAX_LENGTH,
} from "../../src/lib/forum.ts";

test("publicações normalizam bordas, limitam texto e recusam dados de autoria ou moderação forjados", () => {
  const content = {
    title: "  Condição de parada  ",
    topicId: "repeticao",
    body: "  enquanto (i < 10) { i++; }\n ",
  };
  assert.deepEqual(topicContentSchema.parse(content), {
    ...content,
    title: "Condição de parada",
    body: "enquanto (i < 10) { i++; }",
  });
  for (const invalid of [
    { ...content, title: "ab" },
    { ...content, title: "x".repeat(FORUM_TITLE_MAX_LENGTH + 1) },
    { ...content, body: " \n " },
    { ...content, body: "x".repeat(FORUM_BODY_MAX_LENGTH + 1) },
    { ...content, topicId: "unknown" },
    { ...content, authorId: "forged" },
    { ...content, hidden: false },
  ])
    assert.equal(topicContentSchema.safeParse(invalid).success, false);
  const moderation = {
    type: "moderateTopic",
    topicId: randomUUID(),
    expectedVersion: 1,
    hidden: true,
    reason: "Sem relação com a disciplina.",
  };
  assert.equal(forumChangeSchema.safeParse(moderation).success, true);
  for (const invalid of [
    { ...moderation, reason: " " },
    { ...moderation, reason: "x".repeat(FORUM_REASON_MAX_LENGTH + 1) },
    { ...moderation, expectedVersion: 0 },
    { ...moderation, topicId: "../users" },
    { ...moderation, monitor: true },
  ])
    assert.equal(forumChangeSchema.safeParse(invalid).success, false);
});
