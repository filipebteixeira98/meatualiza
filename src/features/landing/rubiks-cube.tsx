"use client";

import { useEffect, useRef, useState } from "react";
import { Box, LoaderCircle, RotateCcw, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cubeFaces } from "./cube-model";
import type { CubeController } from "./cube-scene";

export function RubiksCube() {
  const host = useRef<HTMLDivElement>(null);
  const controller = useRef<CubeController | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );
  const [state, setState] = useState({ busy: false, solved: true });

  useEffect(() => {
    const element = host.current!;
    let disposed = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        import("./cube-scene")
          .then(({ createCubeScene }) => {
            if (disposed) return;
            controller.current = createCubeScene(element, setState, () =>
              setStatus("unavailable"),
            );
            setStatus("ready");
          })
          .catch(() => {
            if (!disposed) setStatus("unavailable");
          });
      },
      { rootMargin: "120px" },
    );
    observer.observe(element);
    return () => {
      disposed = true;
      observer.disconnect();
      controller.current?.dispose();
      controller.current = null;
    };
  }, []);

  return (
    <figure aria-label="Cubo mágico interativo" className="rubiks-cube min-w-0">
      <div className="relative mx-auto aspect-square w-full max-w-md">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-8 left-1/4 h-8 w-1/2 rounded-full bg-foreground/5 blur-xl"
        />
        <div ref={host} className="absolute inset-0" />
        {status === "loading" && (
          <div
            role="status"
            aria-label="Carregando cubo interativo"
            className="absolute inset-0 flex items-center justify-center text-muted-foreground"
          >
            <LoaderCircle aria-hidden="true" className="size-6 animate-spin" />
          </div>
        )}
        {status === "unavailable" && (
          <div
            role="status"
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center text-muted-foreground"
          >
            <Box aria-hidden="true" className="size-12" />
            <p className="max-w-xs text-sm leading-6">
              O cubo 3D está indisponível neste navegador.
            </p>
          </div>
        )}
      </div>
      {status !== "unavailable" && (
        <>
          <figcaption className="text-center text-xs leading-6 text-muted-foreground">
            Arraste para explorar. Clique em uma face para girar.
          </figcaption>
          <div className="mt-3 flex justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 gap-2 px-4"
              aria-label="Embaralhar cubo"
              disabled={status !== "ready" || state.busy}
              onClick={() => controller.current?.scramble()}
            >
              <Shuffle aria-hidden="true" /> Embaralhar
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-11 gap-2 px-4"
              aria-label="Reiniciar cubo"
              disabled={status !== "ready"}
              onClick={() => controller.current?.reset()}
            >
              <RotateCcw aria-hidden="true" /> Reiniciar
            </Button>
          </div>
          <details className="mx-auto mt-3 max-w-sm text-sm">
            <summary className="mx-auto w-fit cursor-pointer rounded px-2 py-2 text-xs text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Girar faces
            </summary>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {cubeFaces.map((face) => (
                <Button
                  key={face.id}
                  type="button"
                  variant="ghost"
                  className="h-11"
                  aria-label={`Girar face: ${face.label}`}
                  disabled={status !== "ready" || state.busy}
                  onClick={() => controller.current?.turn(face)}
                >
                  {face.label}
                </Button>
              ))}
            </div>
            <p className="mt-2 text-center text-xs leading-6 text-muted-foreground">
              No cubo: setas giram a visão; F, R, U, B, L e D movem as faces.
              Shift inverte o giro.
            </p>
          </details>
        </>
      )}
      {status === "ready" && (
        <p role="status" className="sr-only">
          {state.busy
            ? "Movendo peças do cubo."
            : state.solved
              ? "Cubo organizado."
              : "Cubo embaralhado."}
        </p>
      )}
    </figure>
  );
}
