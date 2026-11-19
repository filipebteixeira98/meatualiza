import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  MessageCircle,
  Pencil,
  Plus,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { getForumFeed, getForumTopic } from "@/lib/forum-store";
import { forumIdSchema, type ForumPost, type ForumTopic } from "@/lib/forum";
import { helpRequestTopics } from "@/lib/help-request";
import { monitoria } from "@/lib/monitoria";
import { ModerationForm, PublicationForm } from "./forms";

type Role = "student" | "monitor";
export type ForumSearch = Promise<{ cursor?: string | string[] }>;
const forumBase = (role: Role) =>
  role === "monitor" ? "/monitor/forum" : "/aluno/forum";
const summaryClass =
  "flex min-h-11 cursor-pointer items-center gap-2 rounded-lg text-sm text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring";

function PublishedBy({ post }: { post: ForumPost }) {
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs leading-6 text-muted-foreground [overflow-wrap:anywhere]">
      {post.author && (
        <span className="min-w-0">
          {post.author.displayName}
          {post.author.role === "monitor" && (
            <span className="ml-2 rounded-md bg-monitor-badge px-2 py-1 text-monitor-badge-foreground">
              Monitor
            </span>
          )}
        </span>
      )}
      <time dateTime={post.createdAt}>
        {new Intl.DateTimeFormat("pt-BR", {
          dateStyle: "short",
          timeStyle: "short",
          timeZone: monitoria.fuso,
        }).format(new Date(post.createdAt))}
      </time>
      {post.createdAt !== post.updatedAt && <span>Atualizada</span>}
    </p>
  );
}

function Pagination({
  base,
  next,
  paged,
}: {
  base: string;
  next: string | null;
  paged: boolean;
}) {
  return (
    (paged || next) && (
      <nav
        aria-label="Paginação do fórum"
        className="mt-8 flex flex-wrap gap-3"
      >
        {paged && (
          <Button asChild variant="outline" className="min-h-11">
            <Link href={base}>Voltar ao início</Link>
          </Button>
        )}
        {next && (
          <Button asChild variant="outline" className="min-h-11">
            <Link href={`${base}?cursor=${next}`}>
              Próxima página <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        )}
      </nav>
    )
  );
}

function Publication({
  post,
  topic,
  topicId,
  base,
  monitor,
  locked,
}: {
  post: ForumPost;
  topic?: ForumTopic;
  topicId: string;
  base: string;
  monitor: boolean;
  locked: boolean;
}) {
  const visible = !post.hidden || monitor;
  return (
    <article
      aria-label={
        topic
          ? "Publicação inicial"
          : `Resposta de ${post.author?.displayName ?? "participante"}`
      }
      className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-7"
    >
      <PublishedBy post={post} />
      {post.hidden && (
        <p className="mt-4 rounded-lg bg-muted p-3 text-sm leading-7">
          Publicação ocultada pela moderação.
          {monitor && (
            <span className="block text-muted-foreground [overflow-wrap:anywhere]">
              {post.moderationReason}
            </span>
          )}
        </p>
      )}
      {visible && (
        <p className="mt-5 text-sm leading-7 whitespace-pre-wrap [overflow-wrap:anywhere]">
          {post.body}
        </p>
      )}
      {post.mine && !post.hidden && !locked && (
        <details className="mt-5 border-t border-border pt-2">
          <summary className={summaryClass}>
            <Pencil className="size-4" aria-hidden="true" />
            Editar
          </summary>
          <div className="pt-4">
            {topic ? (
              <PublicationForm base={base} kind="topic" post={topic} />
            ) : (
              <PublicationForm
                base={base}
                kind="reply"
                topicId={topicId}
                post={post}
              />
            )}
          </div>
        </details>
      )}
      {monitor && (
        <details className="mt-5 border-t border-border pt-2">
          <summary className={summaryClass}>
            <Shield className="size-4" aria-hidden="true" />
            {post.hidden ? "Rever ocultação" : "Moderar"}
          </summary>
          <div className="pt-4">
            <ModerationForm
              key={post.version}
              topicId={topicId}
              post={post}
              reply={!topic}
            />
          </div>
        </details>
      )}
    </article>
  );
}

export async function ForumPage({
  role,
  searchParams,
}: {
  role: Role;
  searchParams: ForumSearch;
}) {
  const base = forumBase(role);
  const { cursor } = await searchParams;
  if (cursor !== undefined && !forumIdSchema.safeParse(cursor).success)
    redirect(base);
  const feed = await getForumFeed(
    (await cookies()).get(SESSION_COOKIE)?.value,
    typeof cursor === "string" ? cursor : undefined,
  );
  if (!feed) redirect("/entrar");
  if (feed.role !== role) redirect(forumBase(feed.role));
  return (
    <main
      id="conteudo"
      tabIndex={-1}
      className="site-container flex-1 py-10 sm:py-16"
    >
      <div className="mx-auto max-w-4xl">
        <p className="eyebrow">FÓRUM</p>
        <h1 className="mt-4 text-4xl font-medium tracking-tight sm:text-5xl">
          Uma dúvida. Mais de um caminho.
        </h1>
        <p className="mt-5 text-base leading-7 text-muted-foreground">
          Troque ideias sobre Lógica de Programação com a turma e o monitor.
        </p>
        <details
          id="novo-topico"
          className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-7"
        >
          <summary className={`${summaryClass} font-medium text-foreground`}>
            <Plus className="size-4" aria-hidden="true" />
            Novo tópico
          </summary>
          <div className="pt-5">
            <PublicationForm base={base} kind="topic" />
          </div>
        </details>
        <section aria-label="Tópicos recentes" className="mt-8">
          {feed.topics.length === 0 ? (
            <div
              role="status"
              className="rounded-2xl border border-dashed border-border p-7 text-sm leading-7 text-muted-foreground"
            >
              A conversa começa com uma pergunta. Abra o primeiro tópico.
            </div>
          ) : (
            <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
              {feed.topics.map((topic) => (
                <li key={topic.id} className="min-w-0 p-5 sm:p-7">
                  <Link
                    href={`${base}/${topic.id}`}
                    className="block rounded-sm text-lg font-medium [overflow-wrap:anywhere] focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    {topic.title}
                  </Link>
                  {topic.topicId && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {
                        helpRequestTopics.find(({ id }) => id === topic.topicId)
                          ?.titulo
                      }
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <PublishedBy post={topic} />
                    {!topic.hidden && (
                      <p className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MessageCircle aria-hidden="true" className="size-4" />
                        {topic.replyCount}{" "}
                        {topic.replyCount === 1 ? "resposta" : "respostas"}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Pagination base={base} next={feed.nextCursor} paged={!!cursor} />
        </section>
      </div>
    </main>
  );
}

export async function ForumTopicPage({
  role,
  params,
  searchParams,
}: {
  role: Role;
  params: Promise<{ id: string }>;
  searchParams: ForumSearch;
}) {
  const { id } = await params;
  const base = forumBase(role);
  const { cursor } = await searchParams;
  if (cursor !== undefined && !forumIdSchema.safeParse(cursor).success)
    redirect(`${base}/${id}`);
  const result = await getForumTopic(
    (await cookies()).get(SESSION_COOKIE)?.value,
    id,
    typeof cursor === "string" ? cursor : undefined,
  );
  if (!result) redirect("/entrar");
  if (result.role !== role) redirect(`${forumBase(result.role)}/${id}`);
  if (!result.topic) notFound();
  const topic = result.topic;
  return (
    <main
      id="conteudo"
      tabIndex={-1}
      className="site-container flex-1 py-10 sm:py-16"
    >
      <div className="mx-auto max-w-3xl">
        <Button asChild variant="ghost" className="min-h-11">
          <Link href={base}>
            <ArrowLeft aria-hidden="true" />
            Fórum
          </Link>
        </Button>
        <h1 className="mt-6 text-3xl font-medium leading-tight tracking-tight [overflow-wrap:anywhere] sm:text-4xl">
          {topic.title}
        </h1>
        {topic.topicId && (
          <p className="mt-4 text-sm text-muted-foreground">
            {
              helpRequestTopics.find((subject) => subject.id === topic.topicId)
                ?.titulo
            }
          </p>
        )}
        <div className="mt-8">
          <Publication
            key={topic.version}
            post={topic}
            topic={topic}
            topicId={id}
            base={base}
            monitor={role === "monitor"}
            locked={topic.hidden}
          />
        </div>
        {(!topic.hidden || role === "monitor") && (
          <section aria-labelledby="forum-replies" className="mt-10">
            <h2 id="forum-replies" className="text-xl font-medium">
              Respostas{" "}
              <span className="font-mono text-sm text-muted-foreground">
                ({topic.replyCount})
              </span>
            </h2>
            {result.replies.length === 0 && (
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Tem outro jeito de pensar? Compartilhe sua ideia.
              </p>
            )}
            <div className="mt-5 space-y-4">
              {result.replies.map((post) => (
                <Publication
                  key={`${post.id}-${post.version}`}
                  post={post}
                  topicId={id}
                  base={base}
                  monitor={role === "monitor"}
                  locked={topic.hidden}
                />
              ))}
            </div>
            <Pagination
              base={`${base}/${id}`}
              next={result.nextCursor}
              paged={!!cursor}
            />
          </section>
        )}
        {!topic.hidden && (
          <section
            aria-labelledby="forum-answer"
            className="mt-10 rounded-2xl border border-border bg-card p-5 sm:p-7"
          >
            <h2 id="forum-answer" className="mb-5 text-xl font-medium">
              Entre na conversa
            </h2>
            <PublicationForm base={base} kind="reply" topicId={id} />
          </section>
        )}
      </div>
    </main>
  );
}
