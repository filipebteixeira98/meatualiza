import "server-only";

import { randomBytes, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server.js";
import { isInvalidSession } from "./session.ts";

export const CSRF_COOKIE = "meatualiza_csrf";

class RequestError extends Error {
  readonly status: number;
  constructor(status: number) {
    super("Solicitação de acesso inválida.");
    this.status = status;
  }
}

export function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}

export function issueCsrf() {
  const csrfToken = randomBytes(32).toString("hex");
  const response = NextResponse.json(
    { csrfToken },
    { headers: { "Cache-Control": "no-store" } },
  );
  response.cookies.set(CSRF_COOKIE, csrfToken, {
    ...cookieOptions(),
    maxAge: 10 * 60,
  });
  return response;
}

export async function readAuthRequest(request: NextRequest) {
  if (!process.env.APP_ORIGIN) throw new Error("APP_ORIGIN não configurado.");
  const origin = new URL(process.env.APP_ORIGIN).origin;
  if (request.headers.get("origin") !== origin) throw new RequestError(403);
  if (
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  ) {
    throw new RequestError(415);
  }
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError(400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 12_288) {
      await reader.cancel();
      throw new RequestError(413);
    }
    chunks.push(value);
  }
  let body: unknown;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new RequestError(400);
  }
  const fields =
    request.method === "POST" ? ["csrfToken", "idToken"] : ["csrfToken"];
  if (!body || typeof body !== "object" || Array.isArray(body))
    throw new RequestError(400);
  if (
    Object.keys(body).length !== fields.length ||
    !Object.entries(body).every(
      ([key, value]) =>
        fields.includes(key) && typeof value === "string" && value.length > 0,
    )
  ) {
    throw new RequestError(400);
  }
  const values = body as Record<string, string>;
  const csrfCookie = request.cookies.get(CSRF_COOKIE)?.value ?? "";
  if (
    !/^[a-f0-9]{64}$/.test(values.csrfToken) ||
    !/^[a-f0-9]{64}$/.test(csrfCookie) ||
    !timingSafeEqual(Buffer.from(values.csrfToken), Buffer.from(csrfCookie))
  ) {
    throw new RequestError(403);
  }
  if (values.idToken && values.idToken.length > 8192)
    throw new RequestError(400);
  return values;
}

export function authErrorResponse(error: unknown) {
  const status =
    error instanceof RequestError
      ? error.status
      : isInvalidSession(error)
        ? 401
        : 503;
  const message =
    status === 503
      ? "O acesso está temporariamente indisponível. Tente novamente."
      : status === 401
        ? "Não foi possível confirmar seu acesso. Entre novamente."
        : "Sua solicitação não pôde ser confirmada. Tente novamente.";
  return NextResponse.json(
    { message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
