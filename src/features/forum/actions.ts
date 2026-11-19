"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { changeForum, ForumError } from "@/lib/forum-store";

export async function submitForum(input: unknown, operationId: unknown) {
  try {
    const origin = process.env.APP_ORIGIN;
    if (!origin || (await headers()).get("origin") !== new URL(origin).origin)
      return {
        ok: false,
        message: "Origem da solicitação inválida. Atualize a página.",
      };
    const result = await changeForum(
      (await cookies()).get(SESSION_COOKIE)?.value,
      input,
      operationId,
    );
    for (const base of ["/aluno/forum", "/monitor/forum"]) {
      revalidatePath(base);
      revalidatePath(`${base}/${result.topicId}`);
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof ForumError
          ? error.message
          : "Não foi possível confirmar a publicação. Tente novamente para conferir a mesma solicitação.",
    };
  }
}
