"use client";

import { usePathname } from "next/navigation";

import { ExternalCrmHandoffCta } from "@/components/auth/external-crm-handoff-cta";
import { AuthVisualPanel } from "@/app/(auth)/auth-visual-panel";
import { cn } from "@/lib/utils";

const loginHighlights = [
  { label: "Live field coverage", value: "148 visits", tone: "from-sky-500/18 via-sky-400/10 to-transparent" },
  { label: "Collection movement", value: "BDT 4.8M", tone: "from-emerald-500/18 via-emerald-400/10 to-transparent" },
  { label: "Pending approvals", value: "12 items", tone: "from-violet-500/14 via-fuchsia-400/10 to-transparent" },
];

const performanceItems = [
  { label: "Collection Pulse", value: "87%", tone: "bg-primary/80", note: "vs yesterday +6.2%" },
  { label: "Pending Approvals", value: "12", tone: "bg-sky-400/80", note: "4 need review now" },
  { label: "Visit Coverage", value: "92%", tone: "bg-slate-900/75", note: "strong territory reach" },
];

const workflowItems = [
  { time: "09:10", title: "Morning plan locked", detail: "Targets shared with territory leads.", tone: "bg-sky-500" },
  { time: "12:45", title: "Collections accelerating", detail: "North region moved above forecast.", tone: "bg-emerald-500" },
  { time: "16:20", title: "Approvals ready", detail: "High-value orders waiting for final sign-off.", tone: "bg-violet-500" },
];

const priorityItems = [
  { label: "Route focus", value: "Dhaka Central", hint: "Highest conversion corridor today." },
  { label: "Rep momentum", value: "24 reps above goal", hint: "Driven by visits and repeat orders." },
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
      <div className="relative min-h-svh overflow-x-hidden overflow-y-auto bg-[linear-gradient(180deg,var(--background)_0%,var(--background)_70%,color-mix(in_oklch,var(--muted)_40%,transparent)_100%)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,color-mix(in_oklch,var(--primary)_8%,transparent),transparent_60%)]"
        />
        <div className="relative mx-auto flex min-h-svh w-full max-w-2xl items-start justify-center px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
          <div className="w-full max-w-[28rem] animate-in fade-in slide-in-from-bottom-3 duration-500 motion-reduce:animate-none">
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-svh overflow-x-hidden bg-[linear-gradient(180deg,var(--background)_0%,var(--background)_72%,color-mix(in_oklch,var(--muted)_32%,transparent)_100%)] lg:h-svh lg:min-h-0">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,color-mix(in_oklch,var(--primary)_8%,transparent),transparent_65%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--background)_75%,transparent),transparent)]"
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
                  Daily sales execution, presented with calm control.
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-[15px] max-w-none xl:max-w-[40rem]">
                  Give teams a workspace that feels sharp at 9 AM and still clear at 7 PM.
                  Visits, collections, approvals, and targets stay visible without looking noisy.
                </p>

                <div className="mt-5 max-w-none xl:max-w-[30rem]">
                  <ExternalCrmHandoffCta variant="hero" />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {loginHighlights.map((item) => (
                    <div
                      key={item.label}
                      className={cn(
                        "group relative overflow-hidden rounded-[1.2rem] border border-white/85 bg-white/78 px-4 py-3 shadow-[0_18px_40px_hsl(215_30%_20%_/_0.07)] backdrop-blur-sm",
                        "before:absolute before:inset-0 before:bg-gradient-to-br before:opacity-100 before:content-['']",
                        item.tone
                      )}
                    >
                      <div className="relative">
                        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                          {item.label}
                        </p>
                        <p className="mt-2 text-[1.05rem] font-semibold tracking-tight text-slate-950">
                          {item.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="relative z-10 mt-5">
                  <div className="auth-login-panel auth-login-panel-premium auth-parallax-layer auth-parallax-soft w-full max-w-none rounded-[1.8rem] border border-white/82 bg-white/76 p-4 shadow-[0_32px_80px_hsl(217_33%_17%_/_0.12)] backdrop-blur-md motion-safe:animate-[auth-login-panel-float_17s_ease-in-out_infinite] sm:p-5 xl:max-w-[52rem] 2xl:max-w-[60rem]">
                    <div
                      aria-hidden="true"
                      className="auth-parallax-layer auth-parallax-glow pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.18),transparent_68%)]"
                    />
                    <div
                      aria-hidden="true"
                      className="auth-parallax-layer auth-parallax-soft pointer-events-none absolute -bottom-20 left-8 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.14),transparent_72%)]"
                    />

                    <div className="relative flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">
                          Sales overview
                        </p>
                        <p className="mt-1.5 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                          Daily command board
                        </p>
                      </div>
                      <div className="rounded-full border border-emerald-200/80 bg-emerald-50/90 px-3 py-1 text-xs font-medium text-emerald-700">
                        Ready for live sync
                      </div>
                    </div>

                    <div className="relative mt-4 grid gap-3 lg:grid-cols-[1.22fr_0.78fr] xl:grid-cols-[1.3fr_0.7fr]">
                      <div className="rounded-[1.25rem] border border-slate-200/80 bg-[linear-gradient(180deg,var(--background)_0%,color-mix(in_oklch,var(--muted)_45%,transparent)_100%)] p-3.5 dark:border-slate-800/80">
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
                            className="rounded-[1.1rem] border border-slate-200/80 bg-white/82 p-3 shadow-[0_12px_28px_rgba(15,23,42,0.05)]"
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
                            <p className="mt-1 text-[11px] text-slate-500">
                              {item.note}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 lg:grid-cols-[0.95fr_1.05fr] xl:grid-cols-[1fr_1fr]">
                      <div className="rounded-[1.15rem] border border-slate-200/80 bg-white/84 p-3.5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                            Live workflow
                          </p>
                          <div className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                            <div className="auth-login-signal size-2 rounded-full bg-emerald-400" />
                            Active
                          </div>
                        </div>

                        <div className="mt-3 space-y-3">
                          {workflowItems.map((item) => (
                            <div
                              key={item.title}
                              className="flex gap-3 rounded-[1rem] border border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,250,252,0.76))] px-3 py-2.5"
                            >
                              <div className="flex flex-col items-center gap-2 pt-0.5">
                                <div className={cn("size-2.5 rounded-full shadow-[0_0_0_5px_rgba(255,255,255,0.95)]", item.tone)} />
                                <div className="h-full w-px bg-gradient-to-b from-slate-200 via-slate-200 to-transparent" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-[13px] font-semibold tracking-tight text-slate-900">
                                    {item.title}
                                  </p>
                                  <p className="text-[11px] font-medium text-slate-500">
                                    {item.time}
                                  </p>
                                </div>
                                <p className="mt-1 text-[12px] leading-5 text-slate-600">
                                  {item.detail}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-[1.15rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,250,252,0.84))] p-3.5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
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

                        <div className="mt-3 grid gap-2">
                          {priorityItems.map((item) => (
                            <div
                              key={item.label}
                              className="rounded-[1rem] border border-slate-200/70 bg-white/82 px-3 py-2.5"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                                  {item.label}
                                </p>
                                <p className="text-[13px] font-semibold text-slate-950">
                                  {item.value}
                                </p>
                              </div>
                              <p className="mt-1 text-[12px] leading-5 text-slate-600">
                                {item.hint}
                              </p>
                            </div>
                          ))}
                        </div>
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
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,color-mix(in_oklch,var(--primary)_8%,transparent),transparent_62%)]"
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
