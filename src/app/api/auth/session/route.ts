import { NextRequest, NextResponse } from "next/server.js";
import {
  authErrorResponse,
  cookieOptions,
  CSRF_COOKIE,
  readAuthRequest,
} from "../../../../lib/auth/http.ts";
import {
  createStudentSession,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "../../../../lib/auth/session.ts";

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await readAuthRequest(request);
    const cookie = await createStudentSession(idToken);
    const response = NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
    response.cookies.set(SESSION_COOKIE, cookie, {
      ...cookieOptions(),
      maxAge: SESSION_MAX_AGE,
    });
    response.cookies.set(CSRF_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
    return response;
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await readAuthRequest(request);
    const response = new NextResponse(null, {
      status: 204,
      headers: { "Cache-Control": "no-store" },
    });
    response.cookies.set(SESSION_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
    response.cookies.set(CSRF_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
    return response;
  } catch (error) {
    return authErrorResponse(error);
  }
}
