/** Simple linear regression to forecast next N months */
export function linearRegressionForecast(
  data: number[] | undefined,
  ahead = 3,
): number[] {
  if (!data || data.length === 0) return Array(ahead).fill(0);
  const n = data.length;
  if (n < 2) return Array(ahead).fill(data[0] ?? 0);
  const xs = Array.from({ length: n }, (_, i) => i);
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = data.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((acc, x, i) => acc + x * data[i], 0);
  const sumXX = xs.reduce((acc, x) => acc + x * x, 0);
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return Array(ahead).fill(sumY / n);
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return Array.from({ length: ahead }, (_, i) =>
    Math.max(0, slope * (n + i) + intercept),
  );
}

export function getChurnRisk(status: string): "high" | "medium" | "low" {
  const s = status?.toLowerCase() ?? "";
  if (s === "inactive" || s === "churn" || s === "churned") return "high";
  if (s === "pending") return "medium";
  return "low";
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
