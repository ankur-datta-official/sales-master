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
        className="auth-parallax-layer auth-parallax-glow pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.16),transparent_68%)] motion-safe:animate-[auth-blur-breathe_12s_ease-in-out_infinite]"
      />
      <div
        aria-hidden="true"
        className="auth-parallax-layer auth-parallax-soft pointer-events-none absolute right-0 top-1/3 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.16),transparent_70%)] motion-safe:animate-[auth-blur-breathe_16s_ease-in-out_infinite]"
        style={{ animationDelay: "1.2s" }}
      />
      <div
        aria-hidden="true"
        className="auth-parallax-layer auth-parallax-drift pointer-events-none absolute inset-x-8 bottom-10 h-48 rounded-[2.5rem] border border-white/40 bg-[linear-gradient(135deg,rgba(255,255,255,0.28),rgba(255,255,255,0.06))] opacity-80 backdrop-blur-[2px] motion-safe:animate-[auth-float_18s_ease-in-out_infinite]"
      />
      <div
        aria-hidden="true"
        className="auth-parallax-layer auth-parallax-soft pointer-events-none absolute inset-x-12 top-20 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent motion-safe:animate-[auth-opacity-breathe_10s_ease-in-out_infinite]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40 motion-safe:animate-[auth-mesh-pan_20s_ease-in-out_infinite]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.10) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage:
            "radial-gradient(circle at center, black 0%, black 52%, transparent 100%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 20%, rgba(255,255,255,0.48) 0, transparent 18%), radial-gradient(circle at 82% 18%, rgba(125,211,252,0.22) 0, transparent 18%), radial-gradient(circle at 75% 78%, rgba(52,211,153,0.16) 0, transparent 18%)",
        }}
      />
      {children}
    </div>
  );
}
