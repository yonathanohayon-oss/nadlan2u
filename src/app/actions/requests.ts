"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  CHANGE_REQUEST_STATUSES,
  EXECUTION_STATUSES,
  type ChangeRequestStatus,
  type ExecutionStatus,
} from "@/lib/statuses";

export async function createChangeRequest(formData: FormData) {
  const projectId = String(formData.get("projectId") || "");
  const unitId = String(formData.get("unitId") || "");
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!projectId || !unitId || !title) throw new Error("חסרים שדות חובה");

  const unit = await prisma.unit.findFirst({
    where: { id: unitId, building: { projectId } },
    include: { buyer: true },
  });
  if (!unit?.buyer) throw new Error("דירה או רוכש לא נמצאו בפרויקט");

  const cr = await prisma.changeRequest.create({
    data: {
      projectId,
      unitId,
      buyerId: unit.buyer.id,
      title,
      description,
      notes,
      status: "open",
    },
  });

  revalidatePath(`/projects/${projectId}/requests`);
  redirect(`/projects/${projectId}/requests/${cr.id}`);
}

export async function updateChangeRequestStatus(formData: FormData) {
  const projectId = String(formData.get("projectId") || "");
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "") as ChangeRequestStatus;

  if (!CHANGE_REQUEST_STATUSES.includes(status)) throw new Error("סטטוס לא תקין");

  const existing = await prisma.changeRequest.findFirst({ where: { id, projectId } });
  if (!existing) throw new Error("בקשה לא נמצאה");

  await prisma.changeRequest.update({ where: { id }, data: { status } });
  revalidatePath(`/projects/${projectId}/requests/${id}`);
}

export async function updateExecution(formData: FormData) {
  const projectId = String(formData.get("projectId") || "");
  const id = String(formData.get("id") || "");
  const executionStatus = String(formData.get("executionStatus") || "") as ExecutionStatus;
  const supplierIdRaw = String(formData.get("supplierId") || "");
  const supplierId = supplierIdRaw === "" ? null : supplierIdRaw;

  if (!EXECUTION_STATUSES.includes(executionStatus)) throw new Error("סטטוס ביצוע לא תקין");

  const existing = await prisma.changeRequest.findFirst({ where: { id, projectId } });
  if (!existing) throw new Error("בקשה לא נמצאה");

  if (supplierId) {
    const supplier = await prisma.supplier.findFirst({ where: { id: supplierId, projectId } });
    if (!supplier) throw new Error("ספק לא שייך לפרויקט");
  }

  const status =
    executionStatus === "in_progress"
      ? "in_execution"
      : executionStatus === "done"
        ? "done"
        : existing.status;

  await prisma.changeRequest.update({
    where: { id },
    data: { executionStatus, supplierId, status },
  });

  revalidatePath(`/projects/${projectId}/requests/${id}`);
  revalidatePath(`/projects/${projectId}/reports`);
}
