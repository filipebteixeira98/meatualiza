import assert from "node:assert/strict";
import { test } from "node:test";
import {
  forumBodyBlocks,
  forumInlineCode,
  wrapForumCode,
} from "../../src/lib/forum-body.ts";

test("forum bodies preserve existing text and recognize only delimited code", () => {
  const existing = "linha 1 🙂\n\n    linha 2 <b>literal</b>";
  assert.deepEqual(forumBodyBlocks(existing), [
    { kind: "text", text: existing },
  ]);
  const source =
    "Confira `i`\r\n```js\r\n  if (i < 2) i++;\r\n```\r\nPronto ✅";
  assert.deepEqual(forumBodyBlocks(source), [
    { kind: "text", text: "Confira `i`" },
    { kind: "code", text: "  if (i < 2) i++;", language: "js" },
    { kind: "text", text: "Pronto ✅" },
  ]);
  assert.deepEqual(forumInlineCode("use `i`, `j` e `"), [
    "use ",
    "`i`",
    ", ",
    "`j`",
    " e `",
  ]);
  assert.deepEqual(forumBodyBlocks("```js\ni++;"), [
    { kind: "text", text: "```js\ni++;" },
  ]);
});

test("the code control wraps the selection and preserves inner fences and prose", () => {
  const selected = "primeira linha\n```\núltima linha";
  const draft = "Antes " + selected + " depois";
  const edit = wrapForumCode(draft, 6, 6 + selected.length);
  assert.equal(
    edit.value.slice(edit.selectionStart, edit.selectionEnd),
    selected,
  );
  assert.deepEqual(forumBodyBlocks(edit.value), [
    { kind: "text", text: "Antes " },
    { kind: "code", text: selected, language: "" },
    { kind: "text", text: " depois" },
  ]);
  assert.deepEqual(wrapForumCode("", 0, 0), {
    value: "```\n\n```",
    selectionStart: 4,
    selectionEnd: 4,
  });
});
