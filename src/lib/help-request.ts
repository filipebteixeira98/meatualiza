import { z } from "zod";
import { assuntos } from "./monitoria.ts";

export const helpRequestTopics = [
  ...assuntos,
  { id: "outro", titulo: "Outro assunto / não sei classificar" },
] as const;

export const HELP_DESCRIPTION_MAX_LENGTH = 2000;

export const helpRequestSchema = z.strictObject({
  topicId: z.enum(
    helpRequestTopics.map((topic) => topic.id),
    {
      error:
        "Escolha um assunto ou a opção ‘Outro assunto / não sei classificar’.",
    },
  ),
  description: z
    .string({ error: "Descreva sua dúvida." })
    .trim()
    .min(1, "Descreva sua dúvida.")
    .max(
      HELP_DESCRIPTION_MAX_LENGTH,
      `Use até ${HELP_DESCRIPTION_MAX_LENGTH} caracteres na descrição.`,
    ),
});

export type HelpRequestDraft = z.infer<typeof helpRequestSchema>;
