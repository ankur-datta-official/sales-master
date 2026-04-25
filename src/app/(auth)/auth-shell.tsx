"use client";

import { usePathname } from "next/navigation";

import { AuthVisualPanel } from "@/app/(auth)/auth-visual-panel";
import { cn } from "@/lib/utils";

const loginHighlights = [
  "Field team tracking",
  "Target vs actual visibility",
  "Order approval control",
  "Daily sales reporting",
  "Collection monitoring",
];

const performanceItems = [
  { label: "Collection Pulse", value: "87%", tone: "bg-primary/80" },
  { label: "Pending Approvals", value: "12", tone: "bg-sky-400/80" },
  { label: "Visit Coverage", value: "92%", tone: "bg-slate-900/75" },
];

export function AuthShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (!isLoginPage) {
    return (
      <div className="relative min-h-svh overflow-hidden bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--background))_70%,hsl(var(--muted)/0.4)_100%)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(800px_420px_at_15%_-10%,hsl(var(--primary)/0.08),transparent_60%)]"
        />
        <div className="relative mx-auto flex min-h-svh w-full max-w-xl items-center justify-center px-4 py-10 sm:px-6">
          <div className="w-full animate-in fade-in slide-in-from-bottom-3 duration-500 motion-reduce:animate-none">
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-svh overflow-x-hidden bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--background))_72%,hsl(var(--muted)/0.32)_100%)] lg:h-svh lg:min-h-0">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(1100px_600px_at_20%_-10%,hsl(var(--primary)/0.08),transparent_65%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,hsl(var(--background)/0.75),transparent)]"
      />

      <div className="grid min-h-svh grid-cols-1 lg:h-svh lg:min-h-0 lg:grid-cols-[1.05fr_0.95fr]">
        <AuthVisualPanel>
          <div className="relative flex h-full flex-col px-6 py-8 sm:px-10 sm:py-10 lg:overflow-y-auto lg:px-10 lg:py-6 xl:px-12 xl:py-7">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold tracking-tight text-white shadow-[0_20px_45px_hsl(222_47%_11%_/_0.18)] ring-1 ring-white/60">
                  SM
                </div>
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold tracking-tight text-slate-950">
                    Sales Master
                  </div>
                  <div className="truncate text-sm text-slate-600">
                    Executive sales workspace
                  </div>
                </div>
              </div>

              <div className="hidden rounded-full border border-white/70 bg-white/72 px-3 py-1.5 text-[11px] font-medium tracking-[0.2em] text-slate-500 uppercase shadow-[0_10px_30px_hsl(215_30%_20%_/_0.07)] backdrop-blur-sm xl:inline-flex">
                Secure access
              </div>
            </div>

            <div className="relative z-10 flex flex-1 items-center py-4 lg:items-start lg:py-6">
              <div className="w-full max-w-none xl:max-w-[52rem] 2xl:max-w-[60rem]">
                <div className="inline-flex items-center rounded-full border border-white/80 bg-white/74 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500 shadow-[0_12px_32px_hsl(215_30%_20%_/_0.06)] backdrop-blur-sm">
                  Sales department command center
                </div>
                <h1 className="mt-4 text-balance text-[clamp(2rem,3vw,3rem)] font-semibold leading-[1.04] tracking-[-0.04em] text-slate-950">
                  Sales operations, controlled from one workspace.
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-[15px] max-w-none xl:max-w-[40rem]">
                  Track field teams, targets, visits, collections, and approvals
                  with clear daily visibility.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {loginHighlights.map((item) => (
                    <div
                      key={item}
                      className="rounded-full border border-white/85 bg-white/74 px-3 py-1.5 text-[12px] font-medium text-slate-700 shadow-[0_14px_30px_hsl(215_30%_20%_/_0.06)] backdrop-blur-sm"
                    >
                      {item}
                    </div>
                  ))}
                </div>

                <div className="relative z-10 mt-5">
                  <div className="auth-login-panel auth-parallax-layer auth-parallax-soft rounded-[1.6rem] border border-white/80 bg-white/74 p-4 shadow-[0_28px_70px_hsl(217_33%_17%_/_0.10)] backdrop-blur-sm motion-safe:animate-[auth-login-panel-float_17s_ease-in-out_infinite] sm:p-5 w-full max-w-none xl:max-w-[52rem] 2xl:max-w-[60rem]">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">
                          Sales overview
                        </p>
                        <p className="mt-1.5 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                          Today&apos;s Sales
                        </p>
                      </div>
                      <div className="rounded-full border border-sky-200/80 bg-sky-50/90 px-3 py-1 text-xs font-medium text-sky-700">
                        Live sync
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-[1.22fr_0.78fr] xl:grid-cols-[1.3fr_0.7fr]">
                      <div className="rounded-[1.25rem] border border-slate-200/80 bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--muted)/0.45)_100%)] p-3.5">
                        <div className="flex items-end justify-between gap-4">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                              Target Achievement
                            </p>
                            <p className="mt-1 text-[1.55rem] font-semibold tracking-tight text-slate-950">
                              +18.4%
                            </p>
                          </div>
                          <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                            Above target
                          </div>
                        </div>

                        <div className="mt-3 h-28 sm:h-32 lg:h-36 rounded-[1rem] border border-slate-200/80 bg-white/80 p-3 flex flex-col">
                          <div className="mb-2 flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500 flex-shrink-0">
                            <span>Today&apos;s Sales</span>
                            <span>Target vs actual</span>
                          </div>
                          <div className="flex-1 flex items-end gap-2 sm:gap-3">
                            <div className="h-[45%] flex-1 rounded-t-2xl bg-gradient-to-t from-slate-300 to-slate-200 auth-bar-grow" />
                            <div className="h-[58%] flex-1 rounded-t-2xl bg-gradient-to-t from-slate-400 to-slate-300 auth-bar-grow" style={{ animationDelay: "0.1s" }} />
                            <div className="h-[72%] flex-1 rounded-t-2xl bg-gradient-to-t from-sky-300 to-sky-200 auth-bar-grow" style={{ animationDelay: "0.2s" }} />
                            <div className="h-[78%] flex-1 rounded-t-2xl bg-gradient-to-t from-sky-400 to-sky-300 auth-bar-grow" style={{ animationDelay: "0.3s" }} />
                            <div className="h-[92%] flex-1 rounded-t-2xl bg-gradient-to-t from-slate-900 to-slate-800 auth-bar-grow" style={{ animationDelay: "0.4s" }} />
                            <div className="h-[85%] flex-1 rounded-t-2xl bg-gradient-to-t from-sky-500 to-sky-400 auth-bar-grow" style={{ animationDelay: "0.5s" }} />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        {performanceItems.map((item) => (
                          <div
                            key={item.label}
                            className="rounded-[1.1rem] border border-slate-200/80 bg-white/82 p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[13px] font-medium text-slate-600">
                                {item.label}
                              </p>
                              <div
                                className={cn(
                                  "size-2.5 rounded-full shadow-[0_0_0_6px_hsl(255_255_255_/_0.95)]",
                                  item.tone
                                )}
                              />
                            </div>
                            <p className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
                              {item.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 lg:grid-cols-[0.95fr_1.05fr] xl:grid-cols-[1fr_1fr]">
                      <div className="rounded-[1.1rem] border border-slate-200/80 bg-white/82 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                            Active Field Team
                          </p>
                          <div className="auth-login-signal size-2.5 rounded-full bg-emerald-500" />
                        </div>
                        <p className="mt-1.5 text-lg font-semibold tracking-tight text-slate-950">
                          48 live
                        </p>
                        <p className="mt-1.5 text-[13px] leading-5 text-slate-600">
                          Managers can monitor movement, coverage, and daily follow-up.
                        </p>
                      </div>

                      <div className="rounded-[1.1rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(248,250,252,0.85))] p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                            Collection Pulse
                          </p>
                          <p className="text-xs font-medium text-slate-500">
                            Visit Coverage
                          </p>
                        </div>
                        <svg
                          className="mt-2.5 h-20 w-full overflow-visible"
                          viewBox="0 0 320 100"
                          fill="none"
                          aria-hidden="true"
                          preserveAspectRatio="xMidYMid meet"
                        >
                          <defs>
                            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="rgba(37,99,235,0.9)" />
                              <stop offset="33%" stopColor="rgba(56,189,248,1)" />
                              <stop offset="66%" stopColor="rgba(16,185,129,0.9)" />
                              <stop offset="100%" stopColor="rgba(99,102,241,0.9)" />
                            </linearGradient>
                            <linearGradient id="highlightGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                              <stop offset="50%" stopColor="rgba(255,255,255,0.8)" />
                              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                            </linearGradient>
                            <filter id="glow">
                              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                              <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                              </feMerge>
                            </filter>
                          </defs>
                          <path
                            d="M10 70 C 40 70, 60 35, 95 37 C 120 38, 140 62, 175 58 C 210 53, 225 25, 260 29 C 280 31, 295 35, 310 33"
                            stroke="rgba(148,163,184,0.35)"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                          <path
                            d="M10 70 C 40 70, 60 35, 95 37 C 120 38, 140 62, 175 58 C 210 53, 225 25, 260 29 C 280 31, 295 35, 310 33"
                            stroke="url(#lineGradient)"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeDasharray="100 15"
                            strokeDashoffset="0"
                            className="motion-safe:auth-line-flow-premium"
                          />
                          <path
                            d="M10 70 C 40 70, 60 35, 95 37 C 120 38, 140 62, 175 58 C 210 53, 225 25, 260 29 C 280 31, 295 35, 310 33"
                            stroke="url(#highlightGradient)"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray="30 70"
                            strokeDashoffset="0"
                            className="motion-safe:auth-highlight-flow"
                            filter="url(#glow)"
                          />
                          <circle
                            cx="95"
                            cy="37"
                            r="5"
                            className="motion-safe:auth-dot-premium fill-blue-500"
                            filter="url(#glow)"
                          />
                          <circle
                            cx="175"
                            cy="58"
                            r="5"
                            className="motion-safe:auth-dot-premium fill-cyan-500"
                            style={{ animationDelay: "0.4s" }}
                            filter="url(#glow)"
                          />
                          <circle
                            cx="260"
                            cy="29"
                            r="5"
                            className="motion-safe:auth-dot-premium fill-emerald-500"
                            style={{ animationDelay: "0.8s" }}
                            filter="url(#glow)"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AuthVisualPanel>

        <div className="relative flex items-center justify-center px-4 py-8 sm:px-6 sm:py-10 lg:h-svh lg:px-8 lg:py-6 xl:px-12 xl:py-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(720px_440px_at_30%_12%,hsl(var(--primary)/0.08),transparent_62%)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-10 bottom-0 h-px bg-gradient-to-r from-transparent via-border/80 to-transparent lg:hidden"
          />

          <div className="relative w-full max-w-[26.5rem] lg:flex lg:h-full lg:max-h-[calc(100svh-2rem)] lg:flex-col lg:items-center lg:justify-center">


            <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 motion-reduce:animate-none lg:w-full lg:py-4">
              {children}
            </div>

            <p className="mt-4 text-center text-xs leading-6 text-muted-foreground lg:max-w-sm">
              By signing in, you agree to follow your organization&apos;s usage
              and data policies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
