import "server-only";

import { createHash } from "node:crypto";
import {
  FieldPath,
  FieldValue,
  Timestamp,
  getFirestore,
  type DocumentSnapshot,
} from "firebase-admin/firestore";
import { z } from "zod";
import { getAccountProfile } from "./auth/session.ts";
import { getAdminApp } from "./firebase/admin.ts";
import {
  FORUM_PAGE_SIZE,
  forumChangeSchema,
  forumIdSchema,
  replyContentSchema,
  topicContentSchema,
  type ForumPost,
  type ForumTopic,
} from "./forum.ts";

export class ForumError extends Error {}

const postState = z.object({
  ...replyContentSchema.shape,
  authorId: z.string(),
  authorName: z.string(),
  authorRole: z.enum(["student", "monitor"]),
  hidden: z.boolean(),
  moderationReason: z.string(),
  version: z.int().positive(),
  createdAt: z.instanceof(Timestamp),
  updatedAt: z.instanceof(Timestamp),
});
const topicState = postState.extend({
  title: topicContentSchema.shape.title,
  topicId: topicContentSchema.shape.topicId,
  replyCount: z.int().nonnegative(),
});
type Profile = NonNullable<Awaited<ReturnType<typeof getAccountProfile>>>;

function postView(row: DocumentSnapshot, profile: Profile): ForumPost {
  const post = postState.parse(row.data());
  const visible = !post.hidden || profile.role === "monitor";
  return {
    id: row.id,
    body: visible ? post.body : "",
    author: visible
      ? { displayName: post.authorName, role: post.authorRole }
      : null,
    mine: post.authorId === profile.uid,
    version: post.version,
    hidden: post.hidden,
    moderationReason: profile.role === "monitor" ? post.moderationReason : "",
    createdAt: post.createdAt.toDate().toISOString(),
    updatedAt: post.updatedAt.toDate().toISOString(),
  };
}

function topicView(row: DocumentSnapshot, profile: Profile): ForumTopic {
  const topic = topicState.parse(row.data());
  const visible = !topic.hidden || profile.role === "monitor";
  return {
    ...postView(row, profile),
    title: visible ? topic.title : "Tópico ocultado pela moderação",
    topicId: visible ? topic.topicId : "",
    replyCount: visible ? topic.replyCount : 0,
  };
}

export async function getForumFeed(cookie?: string, cursor?: string) {
  const profile = await getAccountProfile(cookie);
  if (!profile) return null;
  const collection = getFirestore(getAdminApp()).collection("forumTopics");
  let query = collection
    .orderBy("createdAt", "desc")
    .orderBy(FieldPath.documentId(), "desc");
  if (cursor !== undefined) {
    if (!forumIdSchema.safeParse(cursor).success)
      throw new ForumError("Paginação inválida.");
    const row = await collection.doc(cursor).get();
    if (row.exists)
      query = query.startAfter(
        row.get("createdAt") ?? row.get("deletedCreatedAt"),
        row.id,
      );
  }
  const page = await query.limit(FORUM_PAGE_SIZE + 1).get();
  const rows = page.docs.slice(0, FORUM_PAGE_SIZE);
  return {
    role: profile.role,
    topics: rows.map((row) => ({ ...topicView(row, profile), body: "" })),
    nextCursor: page.size > FORUM_PAGE_SIZE ? rows.at(-1)!.id : null,
  };
}

export async function getForumTopic(
  cookie: string | undefined,
  id: unknown,
  cursor?: string,
) {
  const profile = await getAccountProfile(cookie);
  if (!profile) return null;
  const parsed = forumIdSchema.safeParse(id);
  if (!parsed.success)
    return { role: profile.role, topic: null, replies: [], nextCursor: null };
  if (cursor !== undefined && !forumIdSchema.safeParse(cursor).success)
    throw new ForumError("Paginação inválida.");
  const database = getFirestore(getAdminApp());
  const reference = database.collection("forumTopics").doc(parsed.data);
  return database.runTransaction(
    async (transaction) => {
      const row = await transaction.get(reference);
      if (!row.exists || row.get("deletedCreatedAt"))
        return {
          role: profile.role,
          topic: null,
          replies: [],
          nextCursor: null,
        };
      const topic = topicView(row, profile);
      if (topic.hidden && profile.role !== "monitor")
        return { role: profile.role, topic, replies: [], nextCursor: null };
      let query = reference
        .collection("replies")
        .orderBy("createdAt", "asc")
        .orderBy(FieldPath.documentId(), "asc");
      if (cursor) {
        const start = await transaction.get(
          reference.collection("replies").doc(cursor),
        );
        if (start.exists)
          query = query.startAfter(
            start.get("createdAt") ?? start.get("deletedCreatedAt"),
            start.id,
          );
      }
      const page = await transaction.get(query.limit(FORUM_PAGE_SIZE + 1));
      const rows = page.docs.slice(0, FORUM_PAGE_SIZE);
      return {
        role: profile.role,
        topic,
        replies: rows.map((reply) => postView(reply, profile)),
        nextCursor: page.size > FORUM_PAGE_SIZE ? rows.at(-1)!.id : null,
      };
    },
    { readOnly: true },
  );
}

export async function changeForum(
  cookie: string | undefined,
  input: unknown,
  operationId: unknown,
) {
  const profile = await getAccountProfile(cookie);
  if (!profile) throw new ForumError("Entre novamente para publicar no fórum.");
  const parsed = forumChangeSchema.safeParse(input);
  const operation = forumIdSchema.safeParse(operationId);
  if (!parsed.success || !operation.success)
    throw new ForumError(
      parsed.error?.issues[0]?.message ??
        "Solicitação inválida. Atualize a página.",
    );
  const command = parsed.data;
  const hash = createHash("sha256")
    .update(JSON.stringify(command))
    .digest("hex");
  const database = getFirestore(getAdminApp());
  const reference = database
    .collection("forumTopics")
    .doc(command.type === "createTopic" ? operation.data : command.topicId);
  const audit = database
    .collection("forumOperations")
    .doc(`${profile.uid}_${operation.data}`);
  const now = Timestamp.now();
  return database.runTransaction(async (transaction) => {
    const previous = await transaction.get(audit);
    if (previous.exists) {
      if (previous.get("hash") !== hash)
        throw new ForumError("Esta tentativa já foi usada. Atualize a página.");
      return { topicId: reference.id };
    }
    const topicRow = await transaction.get(reference);
    const isReply = "replyId" in command;
    const postReference = isReply
      ? reference.collection("replies").doc(command.replyId)
      : reference;
    const postRow = isReply ? await transaction.get(postReference) : topicRow;

    if (command.type === "createTopic" || command.type === "reply") {
      if (command.type === "createTopic" && topicRow.exists)
        throw new ForumError("Esta publicação já existe. Atualize a página.");
      if (
        command.type === "reply" &&
        (!topicRow.exists ||
          topicRow.get("deletedCreatedAt") ||
          topicState.parse(topicRow.data()).hidden)
      )
        throw new ForumError("Este tópico está indisponível para respostas.");
      const destination =
        command.type === "reply"
          ? reference.collection("replies").doc(operation.data)
          : reference;
      transaction.create(destination, {
        ...command.content,
        ...(command.type === "createTopic" ? { replyCount: 0 } : {}),
        authorId: profile.uid,
        authorName: profile.displayName.includes("@")
          ? "Participante"
          : profile.displayName.slice(0, 120),
        authorRole: profile.role,
        hidden: false,
        moderationReason: "",
        version: 1,
        createdAt: now,
        updatedAt: now,
      });
      if (command.type === "reply")
        transaction.update(reference, { replyCount: FieldValue.increment(1) });
    } else {
      if (
        !topicRow.exists ||
        topicRow.get("deletedCreatedAt") ||
        !postRow.exists ||
        postRow.get("deletedCreatedAt")
      )
        throw new ForumError("Publicação indisponível.");
      const post = postState.parse(postRow.data());
      if (post.version !== command.expectedVersion)
        throw new ForumError(
          "A publicação foi alterada. Atualize a página antes de tentar novamente.",
        );
      if (command.type === "deleteTopic" || command.type === "deleteReply") {
        if (post.authorId !== profile.uid)
          throw new ForumError("Somente o autor pode excluir esta publicação.");
        // Keep the ID and cursor reserved without keeping this post's content.
        transaction.set(postReference, { deletedCreatedAt: post.createdAt });
        if (command.type === "deleteReply")
          transaction.update(reference, {
            replyCount: FieldValue.increment(-1),
          });
      } else if ("hidden" in command) {
        if (profile.role !== "monitor")
          throw new ForumError("Somente o monitor pode moderar publicações.");
        transaction.update(postReference, {
          hidden: command.hidden,
          moderationReason: command.hidden ? command.reason : "",
          version: post.version + 1,
          updatedAt: now,
        });
      } else {
        if (post.authorId !== profile.uid)
          throw new ForumError("Somente o autor pode editar esta publicação.");
        if (post.hidden || topicState.parse(topicRow.data()).hidden)
          throw new ForumError("Publicações ocultadas não podem ser editadas.");
        transaction.update(postReference, {
          ...command.content,
          version: post.version + 1,
          updatedAt: now,
        });
      }
    }
    transaction.create(audit, {
      hash,
      type: command.type,
      by: profile.uid,
      topicId: reference.id,
      ...(isReply ? { replyId: command.replyId } : {}),
      ...("hidden" in command
        ? { hidden: command.hidden, reason: command.reason }
        : {}),
      at: now,
    });
    return { topicId: reference.id };
  });
}
