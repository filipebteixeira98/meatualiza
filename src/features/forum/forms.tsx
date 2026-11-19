"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X } from "lucide-react";
import { AlertDialog, Dialog } from "radix-ui";
import { Button } from "@/components/ui/button";
import { MutationFeedback, useMutation } from "@/features/workspace/mutation";
import {
  FORUM_REASON_MAX_LENGTH,
  FORUM_TITLE_MAX_LENGTH,
  type ForumChange,
  type ForumPost,
  type ForumTopic,
} from "@/lib/forum";
import { helpRequestTopics } from "@/lib/help-request";
import { useHydrated } from "@/lib/use-hydrated";
import { submitForum } from "./actions";
import { PublicationBodyField } from "./body-field";

type PublicationProps = { base: string } & (
  | { kind: "topic"; post?: ForumTopic }
  | { kind: "reply"; topicId: string; post?: ForumPost }
);
const inputClass =
  "mt-2 min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-ring";

export function PublicationForm(props: PublicationProps) {
  const id = useId();
  const ready = useHydrated();
  const router = useRouter();
  const { run, pending, error } = useMutation<ForumChange>(submitForum);
  const initialTopic = props.kind === "topic" ? props.post : undefined;
  const [title, setTitle] = useState(initialTopic?.title ?? "");
  const [subject, setSubject] = useState(initialTopic?.topicId ?? "");
  const [body, setBody] = useState(props.post?.body ?? "");
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState(false);

  function submit() {
    let command: ForumChange;
    if (props.kind === "topic") {
      const selected = helpRequestTopics.find((topic) => topic.id === subject);
      if (!selected) return;
      const content = {
        title,
        topicId: selected.id,
        body,
      };
      command = props.post
        ? {
            type: "editTopic",
            topicId: props.post.id,
            expectedVersion: props.post.version,
            content,
          }
        : { type: "createTopic", content };
    } else {
      command = props.post
        ? {
            type: "editReply",
            topicId: props.topicId,
            replyId: props.post.id,
            expectedVersion: props.post.version,
            content: { body },
          }
        : { type: "reply", topicId: props.topicId, content: { body } };
    }
    setSaved(false);
    run(command, (operationId) => {
      if (command.type === "createTopic") {
        setOpen(false);
        setTitle("");
        setSubject("");
        setBody("");
        router.push(`${props.base}/${operationId}`);
      } else {
        if (command.type === "reply") setBody("");
        setSaved(true);
      }
    });
  }

  const form = (
    <form
      aria-label={
        props.post
          ? "Editar publicação"
          : props.kind === "topic"
            ? "Criar tópico"
            : "Responder tópico"
      }
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <fieldset disabled={!ready || pending} className="min-w-0 space-y-4">
        {props.kind === "topic" && (
          <>
            <div>
              <label htmlFor={`${id}-title`} className="text-sm font-medium">
                Título
              </label>
              <input
                id={`${id}-title`}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                minLength={3}
                maxLength={FORUM_TITLE_MAX_LENGTH}
                className={inputClass}
                placeholder="Em qual parte você travou?"
              />
            </div>
            <div>
              <label htmlFor={`${id}-subject`} className="text-sm font-medium">
                Assunto
              </label>
              <select
                id={`${id}-subject`}
                required
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className={inputClass}
              >
                <option value="" disabled>
                  Escolha um assunto
                </option>
                {helpRequestTopics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.titulo}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
        <PublicationBodyField
          id={`${id}-body`}
          label={props.kind === "topic" ? "Descrição" : "Sua resposta"}
          value={body}
          onChange={setBody}
          className={inputClass}
        />
        <Button type="submit" className="min-h-11" aria-busy={pending}>
          {pending
            ? "Salvando…"
            : props.post
              ? "Salvar alterações"
              : props.kind === "topic"
                ? "Publicar tópico"
                : "Publicar resposta"}
        </Button>
      </fieldset>
      {saved && (
        <p role="status" className="mt-4 text-sm">
          {props.post ? "Alterações salvas." : "Resposta publicada."}
        </p>
      )}
      <MutationFeedback message={error} />
    </form>
  );

  if (props.kind !== "topic" || props.post) return form;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!pending) setOpen(nextOpen);
      }}
    >
      <Dialog.Trigger asChild>
        <Button
          type="button"
          size="sm"
          className="min-h-11 px-3"
          disabled={!ready || pending}
        >
          <Plus aria-hidden="true" />
          Novo tópico
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/80" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-popover p-5 text-popover-foreground shadow-xl sm:p-7">
          <Dialog.Title className="pr-11 text-xl font-medium tracking-tight">
            Novo tópico
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-6 text-muted-foreground">
            Escolha o assunto e descreva sua dúvida para a turma e o monitor.
          </Dialog.Description>
          <div className="mt-5">{form}</div>
          <Dialog.Close asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 size-11"
              aria-label="Fechar novo tópico"
              disabled={pending}
            >
              <X aria-hidden="true" />
            </Button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function DeletePublication({
  base,
  topicId,
  post,
  reply,
}: {
  base: string;
  topicId: string;
  post: ForumPost;
  reply: boolean;
}) {
  const ready = useHydrated();
  const router = useRouter();
  const { run, pending, error } = useMutation<ForumChange>(submitForum);
  const [open, setOpen] = useState(false);
  const label = reply ? "Excluir resposta" : "Excluir tópico";

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!pending) setOpen(next);
      }}
    >
      <AlertDialog.Trigger asChild>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="mt-4 min-h-11 px-3"
          disabled={!ready || pending}
        >
          <Trash2 aria-hidden="true" />
          {label}
        </Button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-background/80" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-popover p-5 text-popover-foreground shadow-xl sm:p-6">
          <Trash2 className="size-5 text-destructive" aria-hidden="true" />
          <AlertDialog.Title className="mt-3 text-xl font-medium text-destructive">
            {label}?
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm leading-6 text-muted-foreground">
            {reply
              ? "Sua resposta será removida desta discussão."
              : "O tópico e todas as respostas deixarão de aparecer no fórum."}{" "}
            Essa ação não pode ser desfeita pelo aplicativo.
          </AlertDialog.Description>
          <MutationFeedback message={error} />
          <div className="mt-5 grid gap-2 sm:flex sm:justify-end">
            <AlertDialog.Cancel asChild>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 px-4"
                disabled={pending}
              >
                Manter publicação
              </Button>
            </AlertDialog.Cancel>
            <Button
              type="button"
              variant="destructive"
              className="min-h-11 px-4"
              disabled={pending}
              aria-busy={pending}
              onClick={() => {
                const target = { topicId, expectedVersion: post.version };
                run(
                  reply
                    ? { type: "deleteReply", ...target, replyId: post.id }
                    : { type: "deleteTopic", ...target },
                  () => {
                    setOpen(false);
                    if (!reply) router.replace(base);
                  },
                );
              }}
            >
              {pending ? "Excluindo…" : "Confirmar exclusão"}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

export function ModerationForm({
  topicId,
  post,
  reply = false,
}: {
  topicId: string;
  post: ForumPost;
  reply?: boolean;
}) {
  const id = useId();
  const ready = useHydrated();
  const [reason, setReason] = useState("");
  const { run, pending, error } = useMutation<ForumChange>(submitForum);
  return (
    <form
      aria-label="Moderar publicação"
      onSubmit={(event) => {
        event.preventDefault();
        const common = {
          topicId,
          expectedVersion: post.version,
          hidden: !post.hidden,
          reason,
        };
        run(
          reply
            ? { type: "moderateReply", ...common, replyId: post.id }
            : { type: "moderateTopic", ...common },
        );
      }}
    >
      <fieldset disabled={!ready || pending} className="min-w-0 space-y-4">
        {post.hidden ? (
          <p className="text-sm leading-7 text-muted-foreground">
            A restauração torna esta publicação visível novamente.
          </p>
        ) : (
          <div>
            <label htmlFor={id} className="text-sm font-medium">
              Motivo da ocultação
            </label>
            <textarea
              id={id}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              required
              maxLength={FORUM_REASON_MAX_LENGTH}
              rows={2}
              className={inputClass}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Até 300 caracteres. Registrado para acompanhamento do monitor.
            </p>
          </div>
        )}
        <Button
          type="submit"
          variant="outline"
          className="min-h-11"
          aria-busy={pending}
        >
          {pending
            ? "Salvando…"
            : post.hidden
              ? "Restaurar publicação"
              : "Ocultar publicação"}
        </Button>
      </fieldset>
      <MutationFeedback message={error} />
    </form>
  );
}
