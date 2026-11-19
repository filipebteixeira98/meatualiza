import { z } from "zod";
import { helpRequestSchema } from "./help-request.ts";

export const FORUM_TITLE_MAX_LENGTH = 120;
export const FORUM_BODY_MAX_LENGTH = 4000;
export const FORUM_REASON_MAX_LENGTH = 300;
export const FORUM_PAGE_SIZE = 10;
export const forumIdSchema = z.uuid();

export const replyContentSchema = z.strictObject({
  body: z
    .string()
    .trim()
    .min(1, "Escreva sua publicação.")
    .max(
      FORUM_BODY_MAX_LENGTH,
      `Use até ${FORUM_BODY_MAX_LENGTH} caracteres na publicação.`,
    ),
});
export const topicContentSchema = replyContentSchema.extend({
  title: z
    .string()
    .trim()
    .min(3, "Use ao menos três caracteres no título.")
    .max(
      FORUM_TITLE_MAX_LENGTH,
      `Use até ${FORUM_TITLE_MAX_LENGTH} caracteres no título.`,
    ),
  topicId: helpRequestSchema.shape.topicId,
});

const target = { topicId: forumIdSchema, expectedVersion: z.int().positive() };
const moderation = {
  hidden: z.boolean(),
  reason: z.string().trim().max(FORUM_REASON_MAX_LENGTH).default(""),
};
export const forumChangeSchema = z
  .discriminatedUnion("type", [
    z.strictObject({
      type: z.literal("createTopic"),
      content: topicContentSchema,
    }),
    z.strictObject({
      type: z.literal("reply"),
      topicId: forumIdSchema,
      content: replyContentSchema,
    }),
    z.strictObject({
      type: z.literal("editTopic"),
      ...target,
      content: topicContentSchema,
    }),
    z.strictObject({
      type: z.literal("editReply"),
      ...target,
      replyId: forumIdSchema,
      content: replyContentSchema,
    }),
    z.strictObject({
      type: z.literal("moderateTopic"),
      ...target,
      ...moderation,
    }),
    z.strictObject({
      type: z.literal("moderateReply"),
      ...target,
      replyId: forumIdSchema,
      ...moderation,
    }),
  ])
  .refine(
    (command) =>
      !("hidden" in command) || !command.hidden || command.reason.length > 0,
    { message: "Informe o motivo da ocultação.", path: ["reason"] },
  );

export type ForumChange = z.infer<typeof forumChangeSchema>;
export type ForumPost = {
  id: string;
  body: string;
  author: { displayName: string; role: "student" | "monitor" } | null;
  mine: boolean;
  version: number;
  hidden: boolean;
  moderationReason: string;
  createdAt: string;
  updatedAt: string;
};
export type ForumTopic = ForumPost & {
  title: string;
  topicId: string;
  replyCount: number;
};
