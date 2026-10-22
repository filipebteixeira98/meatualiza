import assert from "node:assert/strict";
import { test } from "node:test";
import { assuntos } from "../../src/lib/monitoria.ts";
import {
  HELP_DESCRIPTION_MAX_LENGTH,
  helpRequestSchema,
  helpRequestTopics,
} from "../../src/lib/help-request.ts";

test("os nove assuntos aprovados e a opção livre têm identificadores únicos", () => {
  assert.equal(assuntos.length, 9);
  assert.equal(helpRequestTopics.length, 10);
  assert.equal(new Set(helpRequestTopics.map(({ id }) => id)).size, 10);
  for (const { id: topicId } of helpRequestTopics) {
    assert.equal(
      helpRequestSchema.safeParse({
        topicId,
        description: "Como usar um laço?",
      }).success,
      true,
    );
  }
  assert.equal(helpRequestTopics.at(-1).id, "outro");
});

test("recusa assunto ausente, desconhecido ou de tipo incorreto", () => {
  for (const topicId of [undefined, null, "", "javascript", 1, ["repeticao"]]) {
    assert.equal(
      helpRequestSchema.safeParse({
        topicId,
        description: "Como usar um laço?",
      }).success,
      false,
    );
  }
});

test("recusa descrição vazia, apenas espaços ou de tipo incorreto", () => {
  for (const description of [undefined, null, "", " \n\t ", 1, ["dúvida"]]) {
    assert.equal(
      helpRequestSchema.safeParse({ topicId: "outro", description }).success,
      false,
    );
  }
});

test("aceita descrição curta e o limite, mas recusa conteúdo acima dele", () => {
  for (const length of [1, HELP_DESCRIPTION_MAX_LENGTH]) {
    assert.equal(
      helpRequestSchema.safeParse({
        topicId: "outro",
        description: "a".repeat(length),
      }).success,
      true,
    );
  }
  assert.equal(
    helpRequestSchema.safeParse({
      topicId: "outro",
      description: "a".repeat(HELP_DESCRIPTION_MAX_LENGTH + 1),
    }).success,
    false,
  );
});

test("normaliza as bordas, preservando acentos, quebras de linha e código", () => {
  const description = "Por que não termina?\nenquanto (i < 10) { escreva(i); }";
  const parsed = helpRequestSchema.parse({
    topicId: "repeticao",
    description: `  ${description}\n `,
  });
  assert.equal(parsed.description, description);
});

test("o contrato de conteúdo recusa identidade, sessão e estados extras", () => {
  for (const key of ["uid", "studentId", "sessionId", "status", "monitor"]) {
    assert.equal(
      helpRequestSchema.safeParse({
        topicId: "outro",
        description: "Como começar?",
        [key]: "arbitrário",
      }).success,
      false,
    );
  }
});
