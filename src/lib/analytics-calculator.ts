import { getPeriodBounds } from "./target-calculator";

/**
 * Calculates growth percentage with safe handling of zero denominators and missing data.
 */
export function calculateGrowthPct(
  current: number,
  previous: number
): {
  growthPct: number;
  formattedGrowth: string;
  isNew: boolean;
  trend: "up" | "down" | "neutral";
} {
  if (previous === 0 && current === 0) {
    return { growthPct: 0, formattedGrowth: "0%", isNew: false, trend: "neutral" };
  }
  if (previous === 0 && current > 0) {
    return { growthPct: 100, formattedGrowth: "+100% (New)", isNew: true, trend: "up" };
  }
  if (previous === 0 && current < 0) {
    return { growthPct: -100, formattedGrowth: "-100%", isNew: false, trend: "down" };
  }

  const change = current - previous;
  const pct = Math.round((change / Math.abs(previous)) * 100);
  const formattedGrowth = pct > 0 ? `+${pct}%` : `${pct}%`;
  const trend = pct > 0 ? "up" : pct < 0 ? "down" : "neutral";

  return { growthPct: pct, formattedGrowth, isNew: false, trend };
}

/**
 * Resolves current and previous period boundaries for DAILY, WEEKLY, or MONTHLY.
 */
export function resolveComparisonBounds(
  periodType: "DAILY" | "WEEKLY" | "MONTHLY",
  refDateInput?: string | Date
): {
  current: { startDate: Date; endDate: Date; label: string };
  previous: { startDate: Date; endDate: Date; label: string };
} {
  const d = refDateInput ? new Date(refDateInput) : new Date();

  if (periodType === "DAILY") {
    // Current: Target Date
    const curStart = new Date(d);
    curStart.setHours(0, 0, 0, 0);
    const curEnd = new Date(d);
    curEnd.setHours(23, 59, 59, 999);

    // Previous: Target Date - 1 day
    const prevDate = new Date(d);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevStart = new Date(prevDate);
    prevStart.setHours(0, 0, 0, 0);
    const prevEnd = new Date(prevDate);
    prevEnd.setHours(23, 59, 59, 999);

    return {
      current: {
        startDate: curStart,
        endDate: curEnd,
        label: curStart.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      },
      previous: {
        startDate: prevStart,
        endDate: prevEnd,
        label: prevStart.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      },
    };
  }

  if (periodType === "WEEKLY") {
    const curBounds = getPeriodBounds("WEEKLY", d);

    // Previous week: current start - 7 days
    const prevWeekDate = new Date(curBounds.startDate);
    prevWeekDate.setDate(prevWeekDate.getDate() - 7);
    const prevBounds = getPeriodBounds("WEEKLY", prevWeekDate);

    return {
      current: {
        startDate: curBounds.startDate,
        endDate: curBounds.endDate,
        label: curBounds.label,
      },
      previous: {
        startDate: prevBounds.startDate,
        endDate: prevBounds.endDate,
        label: prevBounds.label,
      },
    };
  }

  // MONTHLY
  const curBounds = getPeriodBounds("MONTHLY", d);

  // Previous month
  const prevMonthDate = new Date(curBounds.startDate);
  prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
  const prevBounds = getPeriodBounds("MONTHLY", prevMonthDate);

  return {
    current: {
      startDate: curBounds.startDate,
      endDate: curBounds.endDate,
      label: curBounds.label,
    },
    previous: {
      startDate: prevBounds.startDate,
      endDate: prevBounds.endDate,
      label: prevBounds.label,
    },
  };
}
