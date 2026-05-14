"use client";

import { useEffect, useRef } from "react";

export function AuthVisualPanel({
  children,
}: {
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const targetRef = useRef({ x: 0, y: 0 });

  function setParallax(x: number, y: number) {
    const panel = panelRef.current;

    if (!panel) {
      return;
    }

    panel.style.setProperty("--auth-parallax-x", `${x.toFixed(2)}px`);
    panel.style.setProperty("--auth-parallax-y", `${y.toFixed(2)}px`);
  }

  function queueParallax(x: number, y: number) {
    targetRef.current = { x, y };

    if (frameRef.current !== null) {
      return;
    }

    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      setParallax(targetRef.current.x, targetRef.current.y);
    });
  }

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={panelRef}
      className="auth-parallax relative hidden overflow-hidden border-r border-white/65 bg-[linear-gradient(160deg,var(--background)_0%,color-mix(in_oklch,var(--muted)_55%,var(--background))_46%,var(--background)_100%)] dark:border-white/10 lg:block lg:h-svh"
      onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const offsetX = (event.clientX - bounds.left) / bounds.width - 0.5;
        const offsetY = (event.clientY - bounds.top) / bounds.height - 0.5;

        queueParallax(offsetX * 8, offsetY * 8);
      }}
      onPointerLeave={() => {
        queueParallax(0, 0);
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,color-mix(in_oklch,var(--primary)_12%,transparent),transparent_52%),linear-gradient(180deg,color-mix(in_oklch,var(--card)_68%,transparent),transparent)]"
      />
      <div
        aria-hidden="true"
        className="auth-parallax-layer auth-parallax-soft pointer-events-none absolute inset-x-12 top-20 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent motion-safe:animate-[auth-opacity-breathe_10s_ease-in-out_infinite]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.10) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage:
            "radial-gradient(circle at center, black 0%, black 52%, transparent 100%)",
        }}
      />
      {children}
    </div>
  );
}
