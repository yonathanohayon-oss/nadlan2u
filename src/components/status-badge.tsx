import { Badge } from "@/components/ui/badge";
import {
  CHANGE_REQUEST_STATUS_LABELS,
  EXECUTION_STATUS_LABELS,
  QUOTE_STATUS_LABELS,
  TASK_STATUS_LABELS,
  BILLING_DOC_TYPE_LABELS,
  type ChangeRequestStatus,
  type ExecutionStatus,
  type QuoteStatus,
  type TaskStatus,
  type BillingDocType,
} from "@/lib/statuses";

export function CrStatusBadge({ status }: { status: string }) {
  const label =
    CHANGE_REQUEST_STATUS_LABELS[status as ChangeRequestStatus] || status;
  return <Badge variant="secondary">{label}</Badge>;
}

export function QuoteStatusBadge({ status }: { status: string }) {
  const label = QUOTE_STATUS_LABELS[status as QuoteStatus] || status;
  return <Badge variant="outline">{label}</Badge>;
}

export function ExecutionBadge({ status }: { status: string }) {
  const label =
    EXECUTION_STATUS_LABELS[status as ExecutionStatus] || status;
  return <Badge>{label}</Badge>;
}

export function TaskBadge({ status }: { status: string }) {
  const label = TASK_STATUS_LABELS[status as TaskStatus] || status;
  return <Badge variant={status === "done" ? "secondary" : "default"}>{label}</Badge>;
}

export function BillingTypeBadge({ type }: { type: string }) {
  const label = BILLING_DOC_TYPE_LABELS[type as BillingDocType] || type;
  return <Badge variant="outline">{label}</Badge>;
}
