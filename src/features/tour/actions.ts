"use server";

import { cookies, headers } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { saveTourStatus } from "@/lib/tour";

export async function recordTourDecision(role: unknown, status: unknown) {
  try {
    const origin = process.env.APP_ORIGIN;
    if (!origin || (await headers()).get("origin") !== new URL(origin).origin) {
      return {
        ok: false,
        message: "Atualize a página antes de tentar novamente.",
      };
    }
    const saved = await saveTourStatus(
      (await cookies()).get(SESSION_COOKIE)?.value,
      role,
      status,
    );
    return saved
      ? { ok: true }
      : {
          ok: false,
          message:
            "Atualize a página para confirmar seu acesso e tente novamente.",
        };
  } catch {
    return {
      ok: false,
      message: "Não foi possível salvar o progresso do tour. Tente novamente.",
    };
  }
}
