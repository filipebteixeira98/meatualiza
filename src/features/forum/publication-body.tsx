import { forumBodyBlocks, forumInlineCode } from "@/lib/forum-body";

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
              <code>{block.text}</code>
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
