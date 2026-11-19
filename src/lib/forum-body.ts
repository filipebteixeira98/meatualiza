type BodyBlock =
  | { kind: "text"; text: string }
  | { kind: "code"; text: string; language: string };

export function forumBodyBlocks(body: string): BodyBlock[] {
  const text = body.replace(/\r\n?/g, "\n");
  const blocks: BodyBlock[] = [];
  const fences = /^(`{3,})([\w.+#-]*)[ \t]*\n([\s\S]*?)^\1[ \t]*(?=\n|$)/gm;
  let cursor = 0;
  for (const match of text.matchAll(fences)) {
    if (match.index > cursor) {
      const prose = text.slice(cursor, match.index).replace(/\n$/, "");
      if (prose) blocks.push({ kind: "text", text: prose });
    }
    blocks.push({
      kind: "code",
      text: match[3].replace(/\n$/, ""),
      language: match[2],
    });
    cursor = match.index + match[0].length;
    if (text[cursor] === "\n") cursor++;
  }
  if (cursor < text.length)
    blocks.push({ kind: "text", text: text.slice(cursor) });
  return blocks;
}

export function forumInlineCode(text: string) {
  return text.split(/((?<!`)`[^`\n]+`(?!`))/);
}

export function wrapForumCode(body: string, start: number, end: number) {
  const before = body.slice(0, start);
  const selected = body.slice(start, end);
  const after = body.slice(end);
  // A longer fence keeps any backticks inside the selection literal.
  const longest = Math.max(
    2,
    ...(selected.match(/`+/g) ?? []).map((run) => run.length),
  );
  const fence = "`".repeat(longest + 1);
  const opening = `${before && !before.endsWith("\n") ? "\n" : ""}${fence}\n`;
  const closing = `\n${fence}${after && !after.startsWith("\n") ? "\n" : ""}`;
  const selectionStart = start + opening.length;
  return {
    value: before + opening + selected + closing + after,
    selectionStart,
    selectionEnd: selectionStart + selected.length,
  };
}
