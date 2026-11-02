/** Minimal status sets for the happy path — not a full Nadlan2U enum. */

export const CHANGE_REQUEST_STATUSES = [
  "open",
  "in_pricing",
  "pending_approval",
  "approved",
  "in_execution",
  "done",
  "cancelled",
] as const;

export type ChangeRequestStatus = (typeof CHANGE_REQUEST_STATUSES)[number];

export const CHANGE_REQUEST_STATUS_LABELS: Record<ChangeRequestStatus, string> = {
  open: "פתוחה",
  in_pricing: "בתמחור",
  pending_approval: "ממתינה לאישור",
  approved: "מאושרת",
  in_execution: "בביצוע",
  done: "הושלמה",
  cancelled: "בוטלה",
};

export const QUOTE_STATUSES = [
  "draft",
  "pending_approval",
  "approved",
  "rejected",
] as const;

export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "טיוטה",
  pending_approval: "ממתינה לאישור",
  approved: "מאושרת",
  rejected: "נדחתה",
};

export const EXECUTION_STATUSES = [
  "not_started",
  "in_progress",
  "done",
] as const;

export type ExecutionStatus = (typeof EXECUTION_STATUSES)[number];

export const EXECUTION_STATUS_LABELS: Record<ExecutionStatus, string> = {
  not_started: "טרם החל",
  in_progress: "בביצוע",
  done: "הושלם",
};

export const TASK_STATUSES = ["open", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  open: "פתוחה",
  done: "בוצעה",
};

export const BILLING_DOC_TYPES = ["payment_request", "invoice_record"] as const;
export type BillingDocType = (typeof BILLING_DOC_TYPES)[number];
export const BILLING_DOC_TYPE_LABELS: Record<BillingDocType, string> = {
  payment_request: "דרישת תשלום",
  invoice_record: "תיעוד חשבונית",
};

export function formatILS(amount: number) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}
