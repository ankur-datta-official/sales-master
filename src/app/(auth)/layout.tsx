export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-svh animate-in fade-in duration-500 motion-reduce:animate-none">
      <div className="grid min-h-svh grid-cols-1 lg:grid-cols-2">
        {/* Left: brand atmosphere */}
        <div className="relative hidden overflow-hidden border-r bg-sidebar lg:block">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-60 motion-safe:animate-[auth-mesh-pan_28s_ease-in-out_infinite] motion-reduce:hidden"
            style={{
              backgroundImage: [
                "radial-gradient(900px 520px at 20% -10%, hsl(var(--primary) / 0.18), transparent 60%)",
                "radial-gradient(720px 460px at 90% 10%, hsl(var(--foreground) / 0.06), transparent 58%)",
                "radial-gradient(880px 540px at 60% 120%, hsl(var(--primary) / 0.10), transparent 60%)",
              ].join(","),
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/12 via-transparent to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-32 -top-40 size-[42rem] rounded-full bg-primary/10 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-56 -right-40 size-[46rem] rounded-full bg-foreground/5 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-40 -top-48 size-[52rem] rounded-full bg-primary/8 blur-3xl motion-safe:animate-[auth-glow-drift_22s_ease-in-out_infinite]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-[10%] top-[42%] size-44 rounded-full bg-primary/10 blur-3xl motion-safe:animate-[auth-float_14s_ease-in-out_infinite] motion-reduce:hidden"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-[12%] top-[28%] size-56 rounded-full bg-foreground/5 blur-3xl motion-safe:animate-[auth-float_18s_ease-in-out_infinite] motion-reduce:hidden"
            style={{ animationDelay: "2.5s" }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.35] mix-blend-overlay"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, hsl(var(--foreground) / 0.10) 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.22] [mask-image:radial-gradient(70%_60%_at_50%_35%,black,transparent)]"
            style={{
              backgroundImage:
                "linear-gradient(hsl(var(--foreground)/0.10) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)/0.10) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />

          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <svg
              className="absolute left-8 top-24 h-72 w-[92%] opacity-[0.35]"
              viewBox="0 0 640 240"
              fill="none"
            >
              <path
                d="M10 170 C 90 170, 100 90, 180 96 C 250 101, 260 160, 330 150 C 410 138, 420 54, 510 62 C 585 69, 595 130, 630 120"
                stroke="hsl(var(--foreground)/0.22)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M10 170 C 90 170, 100 90, 180 96 C 250 101, 260 160, 330 150 C 410 138, 420 54, 510 62 C 585 69, 595 130, 630 120"
                stroke="hsl(var(--primary)/0.35)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray="10 12"
                className="motion-safe:animate-[auth-dash_18s_linear_infinite]"
              />
              <circle
                cx="180"
                cy="96"
                r="3.5"
                fill="hsl(var(--primary)/0.55)"
                className="origin-center motion-safe:animate-[auth-pulse_3.4s_ease-in-out_infinite]"
              />
              <circle
                cx="510"
                cy="62"
                r="3.5"
                fill="hsl(var(--primary)/0.45)"
                className="origin-center motion-safe:animate-[auth-pulse_4.2s_ease-in-out_infinite]"
              />
            </svg>

            {/* Ghost UI preview */}
            <div className="absolute bottom-10 left-10 right-10 rounded-3xl border border-border/60 bg-background/35 p-5 shadow-[var(--shadow-md)] backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="h-4 w-28 rounded-lg bg-foreground/5" />
                <div className="h-8 w-24 rounded-xl bg-foreground/6 ring-1 ring-foreground/10" />
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-border/60 bg-background/35 p-3">
                  <div className="h-3 w-16 rounded bg-foreground/6" />
                  <div className="mt-3 h-7 w-20 rounded-xl bg-foreground/6" />
                  <div className="mt-2 h-3 w-24 rounded bg-foreground/5" />
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/35 p-3">
                  <div className="h-3 w-16 rounded bg-foreground/6" />
                  <div className="mt-3 h-7 w-20 rounded-xl bg-foreground/6" />
                  <div className="mt-2 h-3 w-24 rounded bg-foreground/5" />
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/35 p-3">
                  <div className="h-3 w-16 rounded bg-foreground/6" />
                  <div className="mt-3 h-7 w-20 rounded-xl bg-foreground/6" />
                  <div className="mt-2 h-3 w-24 rounded bg-foreground/5" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-3 w-40 rounded bg-foreground/5" />
                <div className="h-3 w-56 rounded bg-foreground/5" />
                <div className="h-3 w-44 rounded bg-foreground/5" />
              </div>
            </div>
          </div>

          <div className="relative flex h-full flex-col justify-between p-10">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-md)] ring-1 ring-border/60">
                <span className="text-sm font-semibold tracking-tight">SM</span>
              </div>
              <div className="min-w-0">
                <div className="truncate text-base font-semibold tracking-tight">
                  Sales Master
                </div>
                <div className="truncate text-sm text-muted-foreground">
                  Executive sales workspace
                </div>
              </div>
            </div>

            <div className="max-w-md">
              <p className="text-balance text-3xl font-semibold tracking-tight">
                A calm, premium operational cockpit for serious business teams.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Designed for daily use: fast scanning, confident actions, and polished
                clarity across the entire workflow.
              </p>
            </div>

            <div className="text-xs text-muted-foreground">
              Secure sign-in · Role-aware access · Audit-ready workflows
            </div>
          </div>
        </div>

        {/* Right: auth form */}
        <div className="relative flex items-center justify-center bg-gradient-to-b from-background via-background to-muted/10 px-4 py-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_520px_at_30%_-10%,hsl(var(--primary)/0.10),transparent_60%)]"
          />
          <div className="relative w-full max-w-md">
            <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 motion-reduce:animate-none">
              {children}
            </div>
            <p className="mt-6 text-center text-xs text-muted-foreground">
              By signing in, you agree to follow your organization’s usage and data policies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
