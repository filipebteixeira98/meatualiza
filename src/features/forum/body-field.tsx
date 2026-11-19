"use client";

import { useRef, useState } from "react";
import { CodeXml, Smile } from "lucide-react";
import { Popover } from "radix-ui";
import { Button } from "@/components/ui/button";
import { FORUM_BODY_MAX_LENGTH } from "@/lib/forum";
import { wrapForumCode } from "@/lib/forum-body";

const emojis = [
  ["😊", "Sorriso"],
  ["😄", "Rosto alegre"],
  ["🤔", "Pensando"],
  ["👀", "Olhando"],
  ["👍", "Positivo"],
  ["👏", "Palmas"],
  ["🙌", "Celebração"],
  ["🙏", "Agradecimento"],
  ["💡", "Ideia"],
  ["✅", "Confirmação"],
  ["🎉", "Festa"],
  ["🚀", "Foguete"],
] as const;

export function PublicationBodyField({
  id,
  label,
  value,
  onChange,
  className,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  className: string;
}) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  const insertedEmoji = useRef(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [exceedsLimit, setExceedsLimit] = useState(false);

  function applyEdit(edit: ReturnType<typeof wrapForumCode>) {
    if (edit.value.length > FORUM_BODY_MAX_LENGTH) {
      setExceedsLimit(true);
      return false;
    }
    setExceedsLimit(false);
    onChange(edit.value);
    requestAnimationFrame(() => {
      textarea.current?.focus({ preventScroll: true });
      textarea.current?.setSelectionRange(
        edit.selectionStart,
        edit.selectionEnd,
      );
    });
    return true;
  }

  function insertEmoji(emoji: string) {
    const field = textarea.current;
    if (!field) return;
    const { selectionStart, selectionEnd } = field;
    const caret = selectionStart + emoji.length;
    if (
      applyEdit({
        value:
          value.slice(0, selectionStart) + emoji + value.slice(selectionEnd),
        selectionStart: caret,
        selectionEnd: caret,
      })
    ) {
      insertedEmoji.current = true;
      setEmojiOpen(false);
    }
  }

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <textarea
        ref={textarea}
        id={id}
        value={value}
        onChange={(event) => {
          setExceedsLimit(false);
          onChange(event.target.value);
        }}
        required
        maxLength={FORUM_BODY_MAX_LENGTH}
        rows={5}
        aria-describedby={`${id}-hint${exceedsLimit ? ` ${id}-limit` : ""}`}
        className={`${className} resize-y leading-7`}
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Popover.Root open={emojiOpen} onOpenChange={setEmojiOpen}>
          <Popover.Trigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-11"
              aria-label="Escolher emoji"
              title="Escolher emoji"
            >
              <Smile aria-hidden="true" />
            </Button>
          </Popover.Trigger>
          <Popover.Content
            aria-label="Seletor de emojis"
            align="start"
            sideOffset={8}
            collisionPadding={12}
            onCloseAutoFocus={(event) => {
              if (insertedEmoji.current) {
                insertedEmoji.current = false;
                event.preventDefault();
              }
            }}
            className="z-30 grid w-56 grid-cols-4 gap-1 rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-lg"
          >
            {emojis.map(([emoji, name]) => (
              <Button
                key={emoji}
                type="button"
                variant="ghost"
                className="size-11 p-0 text-lg"
                aria-label={name}
                title={name}
                onClick={() => insertEmoji(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </Popover.Content>
        </Popover.Root>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          onClick={() => {
            const field = textarea.current;
            if (field)
              applyEdit(
                wrapForumCode(value, field.selectionStart, field.selectionEnd),
              );
          }}
        >
          <CodeXml aria-hidden="true" />
          Bloco de código
        </Button>
      </div>
      <p
        id={`${id}-hint`}
        className="mt-2 text-xs leading-6 text-muted-foreground"
      >
        Use crases como em <code>{"`variável`"}</code> para código em linha. Até
        4.000 caracteres. Seu nome e a publicação ficam visíveis aos
        participantes.
      </p>
      {exceedsLimit && (
        <p
          id={`${id}-limit`}
          role="alert"
          className="mt-2 text-sm text-muted-foreground"
        >
          A inserção ultrapassa o limite de 4.000 caracteres.
        </p>
      )}
    </div>
  );
}
