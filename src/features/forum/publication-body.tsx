import { common, createLowlight } from "lowlight";
import type { ReactNode } from "react";
import { forumBodyBlocks, forumInlineCode } from "@/lib/forum-body";

const highlighter = createLowlight(common);

function renderTokens(
  nodes: ReturnType<typeof highlighter.highlight>["children"],
): ReactNode {
  return nodes.map((node, index) => {
    if (node.type === "text") return node.value;
    if (node.type !== "element") return null;

    const classes = node.properties.className;
    return (
      <span
        key={index}
        className={Array.isArray(classes) ? classes.join(" ") : undefined}
      >
        {renderTokens(node.children)}
      </span>
    );
  });
}

function highlightCode(text: string, label: string) {
  const language = label.toLowerCase();
  if (language) {
    return highlighter.registered(language)
      ? renderTokens(highlighter.highlight(language, text).children)
      : text;
  }

  const detected = highlighter.highlightAuto(text, {
    subset: ["javascript", "typescript", "python", "c", "cpp", "java"],
  });
  return renderTokens(
    (detected.data?.language
      ? detected
      : highlighter.highlight("javascript", text)
    ).children,
  );
}

export function PublicationBody({ body }: { body: string }) {
  return (
    <div className="mt-5 min-w-0 space-y-3 text-sm leading-7">
      {forumBodyBlocks(body).map((block, index) =>
        block.kind === "code" ? (
          <div
            key={index}
            className="min-w-0 rounded-lg border border-border bg-background"
          >
            {block.language && (
              <p className="border-b border-border px-4 py-1 font-mono text-xs leading-6 text-muted-foreground [overflow-wrap:anywhere]">
                {block.language}
              </p>
            )}
            <pre
              tabIndex={0}
              className="overflow-x-auto rounded-lg p-4 font-mono text-xs leading-6 focus-visible:outline-2 focus-visible:outline-ring"
            >
              <code className="forum-code">
                {highlightCode(block.text, block.language)}
              </code>
            </pre>
          </div>
        ) : (
          <p
            key={index}
            className="whitespace-pre-wrap [overflow-wrap:anywhere]"
          >
            {forumInlineCode(block.text).map((part, index) =>
              index % 2 === 0 ? (
                part
              ) : (
                <code
                  key={index}
                  className="rounded bg-muted px-1 py-0.5 font-mono text-sm"
                >
                  {part.slice(1, -1)}
                </code>
              ),
            )}
          </p>
        ),
      )}
    </div>
  );
}
