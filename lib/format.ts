/**
 * Format currency amounts into Indian numbering format (lakhs & crores).
 * Example: 1500000 -> "₹15,00,000"
 */
export function formatINR(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === "") return "—";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "—";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

export interface TimelineProgress {
  percentage: number;
  isOverdue: boolean;
  daysRemaining: number | null;
  totalDays: number | null;
  label: string;
}

/**
 * Calculates timeline progression between start and end dates relative to today.
 */
export function calculateTimelineProgress(
  startDate?: string | null,
  endDate?: string | null
): TimelineProgress {
  if (!startDate && !endDate) {
    return {
      percentage: 0,
      isOverdue: false,
      daysRemaining: null,
      totalDays: null,
      label: "No dates set",
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = startDate ? new Date(startDate) : null;
  if (start) start.setHours(0, 0, 0, 0);

  const end = endDate ? new Date(endDate) : null;
  if (end) end.setHours(0, 0, 0, 0);

  // If only start date is provided
  if (start && !end) {
    if (today < start) {
      return {
        percentage: 0,
        isOverdue: false,
        daysRemaining: null,
        totalDays: null,
        label: `Starts ${startDate}`,
      };
    }
    return {
      percentage: 100,
      isOverdue: false,
      daysRemaining: null,
      totalDays: null,
      label: `Started ${startDate}`,
    };
  }

  // If only end date is provided
  if (!start && end) {
    const diffTime = end.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isOverdue = daysRemaining < 0;

    return {
      percentage: isOverdue ? 100 : 50,
      isOverdue,
      daysRemaining: Math.abs(daysRemaining),
      totalDays: null,
      label: isOverdue ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days remaining`,
    };
  }

  // Both start and end dates provided
  if (start && end) {
    const totalDuration = end.getTime() - start.getTime();
    const totalDays = Math.max(1, Math.round(totalDuration / (1000 * 60 * 60 * 24)));

    if (today < start) {
      const daysUntilStart = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return {
        percentage: 0,
        isOverdue: false,
        daysRemaining: totalDays,
        totalDays,
        label: `Starts in ${daysUntilStart} days`,
      };
    }

    if (today > end) {
      const daysOverdue = Math.ceil((today.getTime() - end.getTime()) / (1000 * 60 * 60 * 24));
      return {
        percentage: 100,
        isOverdue: true,
        daysRemaining: daysOverdue,
        totalDays,
        label: `${daysOverdue} days overdue`,
      };
    }

    // Currently within timeline
    const elapsed = today.getTime() - start.getTime();
    const rawPct = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 100;
    const percentage = Math.min(100, Math.max(0, Math.round(rawPct)));
    const daysRemaining = Math.max(0, Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

    return {
      percentage,
      isOverdue: false,
      daysRemaining,
      totalDays,
      label: `${daysRemaining} days left (${percentage}%)`,
    };
  }

  return {
    percentage: 0,
    isOverdue: false,
    daysRemaining: null,
    totalDays: null,
    label: "",
  };
}
