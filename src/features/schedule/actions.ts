"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { BookingError, changeBooking } from "@/lib/bookings";

export async function submitBooking(input: unknown, operationId: unknown) {
  try {
    const origin = process.env.APP_ORIGIN;
    if (!origin || (await headers()).get("origin") !== new URL(origin).origin)
      return {
        ok: false,
        message: "Origem da solicitação inválida. Atualize a página.",
      };
    await changeBooking(
      (await cookies()).get(SESSION_COOKIE)?.value,
      input,
      operationId,
    );
    for (const path of ["/aluno/agenda", "/aluno/duvida", "/monitor/agenda"])
      revalidatePath(path);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof BookingError
          ? error.message
          : "Não foi possível confirmar a alteração. Tente novamente; sua tentativa será conferida antes de repetir a operação.",
    };
  }
}
