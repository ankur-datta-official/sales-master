"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { CalendarDays } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { DashboardFilters } from "@/modules/dashboard/types";

type Props = {
  filters: DashboardFilters;
};

function getOptionLabel(
  options: DashboardFilters["divisionOptions"] | DashboardFilters["zoneOptions"] | DashboardFilters["viewOptions"],
  value: string,
  fallback: string
) {
  return options?.find((option) => option.value === value)?.label ?? fallback;
}

function setParam(params: URLSearchParams, key: string, value: string | undefined) {
  if (value && value.trim()) {
    params.set(key, value.trim());
    return;
  }
  params.delete(key);
}

export function CeoFilterControls({ filters }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [formState, setFormState] = useState(() => ({
    division: filters.divisionValue ?? "",
    zone: filters.zoneValue ?? "",
    view: String(filters.activeViewKey ?? "executive_overview"),
    dateFrom: filters.dateFrom ?? "",
    dateTo: filters.dateTo ?? "",
  }));

  useEffect(() => {
    setFormState({
      division: filters.divisionValue ?? "",
      zone: filters.zoneValue ?? "",
      view: String(filters.activeViewKey ?? "executive_overview"),
      dateFrom: filters.dateFrom ?? "",
      dateTo: filters.dateTo ?? "",
    });
  }, [
    filters.activeViewKey,
    filters.dateFrom,
    filters.dateTo,
    filters.divisionValue,
    filters.zoneValue,
  ]);

  const updateFilter = (partial: {
    division?: string;
    zone?: string;
    view?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());
    const nextDivision = partial.division ?? filters.divisionValue ?? "";
    const nextZone = partial.zone ?? filters.zoneValue ?? "";
    const nextView = partial.view ?? filters.activeViewKey ?? "executive_overview";
    const nextDateFrom = partial.dateFrom ?? filters.dateFrom ?? "";
    const nextDateTo = partial.dateTo ?? filters.dateTo ?? "";

    setParam(params, "division", nextDivision);
    setParam(params, "zone", nextZone);
    setParam(params, "view", nextView);
    setParam(params, "dateFrom", nextDateFrom);
    setParam(params, "dateTo", nextDateTo);

    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  };

  const frameClass = cn(
    "rounded-2xl border border-border/70 bg-card/95 px-3.5 py-3 shadow-[var(--shadow-xs)] transition-opacity",
    isPending && "opacity-70"
  );
  const triggerClass =
    "mt-2 h-10 w-full rounded-xl border border-border/60 bg-background/70 px-3 text-sm font-medium shadow-none ring-0 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";
  const divisionLabel = getOptionLabel(filters.divisionOptions, formState.division, "All divisions");
  const zoneLabel = getOptionLabel(filters.zoneOptions, formState.zone, "All zones");
  const viewLabel = getOptionLabel(filters.viewOptions, formState.view, "Executive Overview");

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div className={frameClass}>
        <p className="text-[0.7rem] font-semibold text-muted-foreground">Division</p>
        <div>
          <Select
            value={formState.division}
            onValueChange={(division) => {
              const nextDivision = division ?? "";
              setFormState((current) => ({ ...current, division: nextDivision }));
              updateFilter({ division: nextDivision });
            }}
          >
            <SelectTrigger className={triggerClass}>
              <span className="truncate">{divisionLabel}</span>
            </SelectTrigger>
            <SelectContent align="start" className="rounded-2xl">
              {(filters.divisionOptions ?? []).map((option) => (
                <SelectItem key={option.value || "all-divisions"} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className={frameClass}>
        <p className="text-[0.7rem] font-semibold text-muted-foreground">Zone</p>
        <div>
          <Select
            value={formState.zone}
            onValueChange={(zone) => {
              const nextZone = zone ?? "";
              setFormState((current) => ({ ...current, zone: nextZone }));
              updateFilter({ zone: nextZone });
            }}
          >
            <SelectTrigger className={triggerClass}>
              <span className="truncate">{zoneLabel}</span>
            </SelectTrigger>
            <SelectContent align="start" className="rounded-2xl">
              {(filters.zoneOptions ?? []).map((option) => (
                <SelectItem key={option.value || "all-zones"} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className={frameClass}>
        <p className="text-[0.7rem] font-semibold text-muted-foreground">Date Range</p>
        <div className="mt-2 flex h-10 items-center gap-2 rounded-xl border border-border/60 bg-background/70 px-3">
          <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
          <div className="grid min-w-0 flex-1 grid-cols-[1fr_auto_1fr] items-center gap-2">
            <input
              type="date"
              value={formState.dateFrom}
              onChange={(event) => {
                const dateFrom = event.target.value;
                setFormState((current) => ({ ...current, dateFrom }));
                updateFilter({ dateFrom });
              }}
              className="min-w-0 bg-transparent text-sm font-medium outline-none"
            />
            <span className="text-xs font-medium text-muted-foreground">to</span>
            <input
              type="date"
              value={formState.dateTo}
              onChange={(event) => {
                const dateTo = event.target.value;
                setFormState((current) => ({ ...current, dateTo }));
                updateFilter({ dateTo });
              }}
              className="min-w-0 bg-transparent text-sm font-medium outline-none"
            />
          </div>
        </div>
      </div>

      <div className={frameClass}>
        <p className="text-[0.7rem] font-semibold text-muted-foreground">View Type</p>
        <div>
          <Select
            value={formState.view}
            onValueChange={(view) => {
              const nextView = view ?? "executive_overview";
              setFormState((current) => ({ ...current, view: nextView }));
              updateFilter({ view: nextView });
            }}
          >
            <SelectTrigger className={triggerClass}>
              <span className="truncate">{viewLabel}</span>
            </SelectTrigger>
            <SelectContent align="start" className="rounded-2xl">
              {(filters.viewOptions ?? []).map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
