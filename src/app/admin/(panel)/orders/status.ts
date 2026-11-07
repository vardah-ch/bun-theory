export const STATUS_LABEL: Record<string, string> = {
  PENDING: "New",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  READY: "Ready",
  OUT_FOR_DELIVERY: "Out for delivery",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const ORDER_FLOW = ["PENDING", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "COMPLETED"] as const;

export function statusTone(s: string): "neutral" | "fire" | "good" | "warn" {
  if (s === "PENDING") return "fire";
  if (s === "COMPLETED") return "good";
  if (s === "CANCELLED") return "neutral";
  return "warn";
}
