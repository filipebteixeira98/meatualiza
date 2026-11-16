"use client";

import { useEffect, useRef, useState } from "react";
import { Box, LoaderCircle } from "lucide-react";
import type { CubeController } from "./cube-scene";

export function RubiksCube() {
  const host = useRef<HTMLDivElement>(null);
  const controller = useRef<CubeController | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );

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
            controller.current = createCubeScene(element, () =>
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
    <figure aria-label="Cubo mágico interativo" className="min-w-0">
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
    </figure>
  );
}
