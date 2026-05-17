import type { RoleDashboardData } from "@/modules/dashboard/types";

function csvEscape(value: string | number | null | undefined): string {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function pushCsvRow(lines: string[], cells: Array<string | number | null | undefined>) {
  lines.push(cells.map(csvEscape).join(","));
}

export function buildDashboardCsvContent(dashboard: RoleDashboardData): string {
  const lines: string[] = [];

  pushCsvRow(lines, ["Sales Master Executive Export"]);
  pushCsvRow(lines, ["Dashboard", dashboard.title]);
  pushCsvRow(lines, ["Generated For", dashboard.userName]);
  pushCsvRow(lines, ["Date Range", dashboard.filters.dateLabel]);
  pushCsvRow(lines, ["Scope", dashboard.filters.scopeLabel]);
  pushCsvRow(lines, ["View Type", dashboard.filters.activeView]);
  lines.push("");

  pushCsvRow(lines, ["KPI Summary"]);
  pushCsvRow(lines, ["Key", "Label", "Value", "Hint", "Detail"]);
  for (const kpi of dashboard.kpis) {
    pushCsvRow(lines, [kpi.key, kpi.label, kpi.value, kpi.hint ?? "", kpi.detail ?? ""]);
  }
  lines.push("");

  pushCsvRow(lines, ["Target Progress"]);
  pushCsvRow(lines, ["Key", "Label", "Actual", "Target", "Percent"]);
  for (const metric of dashboard.progress) {
    pushCsvRow(lines, [metric.key, metric.label, metric.actual, metric.target, `${metric.percent}%`]);
  }
  lines.push("");

  pushCsvRow(lines, ["Mini Stats"]);
  pushCsvRow(lines, ["Key", "Label", "Value", "Hint"]);
  for (const stat of dashboard.miniStats) {
    pushCsvRow(lines, [stat.key, stat.label, stat.value, stat.hint ?? ""]);
  }
  lines.push("");

  pushCsvRow(lines, ["Trend Summary"]);
  pushCsvRow(lines, ["Label", "Sales", "Collections"]);
  for (const point of dashboard.trend) {
    pushCsvRow(lines, [point.label, point.sales, point.collections]);
  }
  lines.push("");

  for (const section of dashboard.sections) {
    pushCsvRow(lines, [section.title]);
    if (section.description) {
      pushCsvRow(lines, [section.description]);
    }
    pushCsvRow(lines, section.columns.map((column) => column.label));
    if (section.rows.length === 0) {
      pushCsvRow(lines, [section.emptyLabel]);
    } else {
      for (const row of section.rows) {
        pushCsvRow(
          lines,
          section.columns.map((column) => row.cells.find((cell) => cell.key === column.key)?.value ?? "")
        );
      }
    }
    lines.push("");
  }

  pushCsvRow(lines, ["Alerts & Notifications"]);
  pushCsvRow(lines, ["Title", "Detail", "Time", "Tone"]);
  for (const alert of dashboard.alerts) {
    pushCsvRow(lines, [alert.title, alert.detail ?? "", alert.time ?? "", alert.tone ?? "neutral"]);
  }

  return `\uFEFF${lines.join("\n")}`;
}

