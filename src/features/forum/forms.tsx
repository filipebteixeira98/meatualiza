"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MutationFeedback, useMutation } from "@/features/workspace/mutation";
import {
  FORUM_BODY_MAX_LENGTH,
  FORUM_REASON_MAX_LENGTH,
  FORUM_TITLE_MAX_LENGTH,
  type ForumChange,
  type ForumPost,
  type ForumTopic,
} from "@/lib/forum";
import { helpRequestTopics } from "@/lib/help-request";
import { useHydrated } from "@/lib/use-hydrated";
import { submitForum } from "./actions";

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
      if (command.type === "createTopic")
        router.push(`${props.base}/${operationId}`);
      else {
        if (command.type === "reply") setBody("");
        setSaved(true);
      }
    });
  }

  return (
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
        <div>
          <label htmlFor={`${id}-body`} className="text-sm font-medium">
            {props.kind === "topic" ? "Descrição" : "Sua resposta"}
          </label>
          <textarea
            id={`${id}-body`}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            required
            maxLength={FORUM_BODY_MAX_LENGTH}
            rows={5}
            aria-describedby={`${id}-hint`}
            className={`${inputClass} resize-y leading-7`}
          />
          <p
            id={`${id}-hint`}
            className="mt-2 text-xs leading-6 text-muted-foreground"
          >
            Texto simples, até 4.000 caracteres. Seu nome e a publicação ficam
            visíveis aos participantes.
          </p>
        </div>
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
