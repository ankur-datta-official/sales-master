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
      className="auth-parallax relative hidden overflow-hidden border-r border-white/65 bg-[linear-gradient(160deg,#f7fbff_0%,#edf4fb_46%,#f8fafc_100%)] lg:block lg:h-svh"
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
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(720px_420px_at_18%_12%,rgba(59,130,246,0.12),transparent_62%),radial-gradient(640px_360px_at_82%_8%,rgba(15,23,42,0.07),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.68),rgba(248,250,252,0.18))]"
      />
      <div
        aria-hidden="true"
        className="auth-parallax-layer auth-parallax-glow pointer-events-none absolute inset-x-[-10%] top-[-8%] h-[26rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.18),rgba(59,130,246,0.08)_38%,transparent_68%)] blur-3xl motion-safe:animate-[auth-login-glow_18s_ease-in-out_infinite]"
      />
      <div
        aria-hidden="true"
        className="auth-parallax-layer auth-parallax-soft pointer-events-none absolute left-[8%] top-[14%] h-56 w-56 rounded-full bg-sky-200/40 blur-3xl motion-safe:animate-[auth-login-float_18s_ease-in-out_infinite]"
      />
      <div
        aria-hidden="true"
        className="auth-parallax-layer auth-parallax-drift pointer-events-none absolute right-[8%] top-[12%] h-64 w-64 rounded-full bg-slate-200/55 blur-3xl motion-safe:animate-[auth-login-float_22s_ease-in-out_infinite]"
        style={{ animationDelay: "2s" }}
      />
      <div
        aria-hidden="true"
        className="auth-parallax-layer auth-parallax-soft pointer-events-none absolute bottom-[18%] right-[16%] h-40 w-40 rounded-full bg-white/45 blur-2xl motion-safe:animate-[auth-login-float_20s_ease-in-out_infinite]"
        style={{ animationDelay: "4s" }}
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
