"use client";

import { useEffect, useRef, useState } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type Auth,
} from "firebase/auth";
import { LoaderCircle, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBrowserAuth } from "@/lib/firebase/client";

const unavailable =
  "Não foi possível concluir o acesso. Tente novamente em instantes.";

async function changeSession(method: "POST" | "DELETE", idToken?: string) {
  const csrfResponse = await fetch("/api/auth/csrf", { cache: "no-store" });
  if (!csrfResponse.ok) return unavailable;
  const { csrfToken } = await csrfResponse.json();
  const response = await fetch("/api/auth/session", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ csrfToken, ...(idToken ? { idToken } : {}) }),
  });
  if (response.ok) return null;
  const body = await response.json();
  return typeof body.message === "string" ? body.message : unavailable;
}

function Notice({ message }: { message: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (message) ref.current?.focus();
  }, [message]);
  return message ? (
    <p
      ref={ref}
      tabIndex={-1}
      role="alert"
      className="mt-4 rounded-lg border border-border p-3 text-sm leading-6 focus-visible:outline-2 focus-visible:outline-ring"
    >
      {message}
    </p>
  ) : null;
}

export function GoogleSignIn() {
  const [stage, setStage] = useState<"idle" | "google" | "session">("idle");
  const [message, setMessage] = useState("");

  async function enter() {
    if (stage !== "idle") return;
    setStage("google");
    setMessage("");
    let auth: Auth | undefined;
    let entered = false;
    try {
      auth = getBrowserAuth();
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      setStage("session");
      const error = await changeSession("POST", await result.user.getIdToken());
      if (error) setMessage(error);
      else entered = true;
    } catch (error) {
      const code =
        error && typeof error === "object" && "code" in error ? error.code : "";
      setMessage(
        code === "auth/popup-closed-by-user"
          ? "A entrada foi cancelada. Quando quiser, tente novamente."
          : code === "auth/popup-blocked"
            ? "Permita a abertura do popup do Google e tente novamente."
            : unavailable,
      );
    } finally {
      if (auth) await signOut(auth).catch(() => {});
      setStage("idle");
    }
    if (entered) window.location.replace("/aluno");
  }

  return (
    <div className="mt-8">
      <Button
        type="button"
        className="h-11 w-full text-sm"
        onClick={enter}
        disabled={stage !== "idle"}
        aria-busy={stage !== "idle"}
      >
        {stage !== "idle" ? (
          <LoaderCircle
            className="motion-safe:animate-spin"
            aria-hidden="true"
          />
        ) : (
          <LogIn aria-hidden="true" />
        )}
        {stage === "google"
          ? "Abrindo Google…"
          : stage === "session"
            ? "Confirmando acesso…"
            : "Entrar com Google"}
      </Button>
      <Notice message={message} />
    </div>
  );
}

export function StudentSignOut() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const refresh = (event: PageTransitionEvent) => {
      if (event.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", refresh);
    return () => window.removeEventListener("pageshow", refresh);
  }, []);

  async function leave() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const error = await changeSession("DELETE");
      if (error) {
        setMessage(error);
        return;
      }
      try {
        await signOut(getBrowserAuth());
      } catch {
        // A navegação completa descarta o estado em memória se a limpeza local falhar.
      }
      window.location.replace("/");
    } catch {
      setMessage(
        "Não foi possível sair. Sua sessão continua ativa; tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Button
        type="button"
        className="h-11 w-full sm:w-auto"
        variant="outline"
        onClick={leave}
        disabled={busy}
        aria-busy={busy}
      >
        {busy ? (
          <LoaderCircle
            className="motion-safe:animate-spin"
            aria-hidden="true"
          />
        ) : (
          <LogOut aria-hidden="true" />
        )}
        {busy ? "Saindo…" : "Sair da conta"}
      </Button>
      <Notice message={message} />
    </div>
  );
}
