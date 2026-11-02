"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { BILLING_DOC_TYPES, type BillingDocType } from "@/lib/statuses";

export async function createBillingDocument(formData: FormData) {
  const projectId = String(formData.get("projectId") || "");
  const type = String(formData.get("type") || "") as BillingDocType;
  const title = String(formData.get("title") || "").trim();
  const amount = Number(formData.get("amount") || 0);
  const notes = String(formData.get("notes") || "").trim();
  const changeRequestIdRaw = String(formData.get("changeRequestId") || "");
  const quoteIdRaw = String(formData.get("quoteId") || "");
  const changeRequestId = changeRequestIdRaw || null;
  const quoteId = quoteIdRaw || null;

  if (!projectId || !title || !BILLING_DOC_TYPES.includes(type) || !Number.isFinite(amount)) {
    throw new Error("שדות לא תקינים");
  }

  if (changeRequestId) {
    const cr = await prisma.changeRequest.findFirst({
      where: { id: changeRequestId, projectId },
    });
    if (!cr) throw new Error("בקשה לא שייכת לפרויקט");
  }
  if (quoteId) {
    const quote = await prisma.quote.findFirst({ where: { id: quoteId, projectId } });
    if (!quote) throw new Error("הצעה לא שייכת לפרויקט");
  }

  await prisma.billingDocument.create({
    data: {
      projectId,
      type,
      title,
      amount,
      notes,
      changeRequestId,
      quoteId,
    },
  });

  revalidatePath(`/projects/${projectId}/billing`);
  revalidatePath(`/projects/${projectId}/reports`);
}
