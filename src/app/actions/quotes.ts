"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createQuoteFromMatrix(formData: FormData) {
  const projectId = String(formData.get("projectId") || "");
  const changeRequestId = String(formData.get("changeRequestId") || "");
  const notes = String(formData.get("notes") || "").trim();
  const selected = formData.getAll("matrixItemId").map(String);
  const quantities = formData.getAll("quantity").map(String);

  if (!projectId || !changeRequestId || selected.length === 0) {
    throw new Error("יש לבחור לפחות סעיף אחד מהמחירון");
  }

  const cr = await prisma.changeRequest.findFirst({
    where: { id: changeRequestId, projectId },
  });
  if (!cr) throw new Error("בקשה לא נמצאה");

  const items = await prisma.priceMatrixItem.findMany({
    where: { projectId, id: { in: selected } },
  });
  if (items.length === 0) throw new Error("סעיפים לא נמצאו במחירון הפרויקט");

  const quote = await prisma.quote.create({
    data: {
      projectId,
      changeRequestId,
      status: "draft",
      notes,
      lines: {
        create: items.map((item, idx) => {
          const qty = Number(quantities[idx] || 1);
          return {
            matrixItemId: item.id,
            description: `${item.code} — ${item.description}`,
            unit: item.unit,
            quantity: Number.isFinite(qty) && qty > 0 ? qty : 1,
            unitPrice: item.unitPrice,
          };
        }),
      },
    },
  });

  await prisma.changeRequest.update({
    where: { id: changeRequestId },
    data: { status: "in_pricing" },
  });

  revalidatePath(`/projects/${projectId}/requests/${changeRequestId}`);
  return quote.id;
}

export async function submitQuoteForApproval(formData: FormData) {
  const projectId = String(formData.get("projectId") || "");
  const quoteId = String(formData.get("quoteId") || "");
  const changeRequestId = String(formData.get("changeRequestId") || "");

  const quote = await prisma.quote.findFirst({ where: { id: quoteId, projectId } });
  if (!quote) throw new Error("הצעה לא נמצאה");

  await prisma.quote.update({
    where: { id: quoteId },
    data: { status: "pending_approval" },
  });
  await prisma.changeRequest.update({
    where: { id: changeRequestId },
    data: { status: "pending_approval" },
  });

  revalidatePath(`/projects/${projectId}/requests/${changeRequestId}`);
}

export async function recordBuyerApproval(formData: FormData) {
  const projectId = String(formData.get("projectId") || "");
  const quoteId = String(formData.get("quoteId") || "");
  const changeRequestId = String(formData.get("changeRequestId") || "");
  const note = String(formData.get("note") || "").trim();

  const quote = await prisma.quote.findFirst({ where: { id: quoteId, projectId } });
  if (!quote) throw new Error("הצעה לא נמצאה");

  const updated = await prisma.quote.update({
    where: { id: quoteId },
    data: {
      buyerApprovedAt: new Date(),
      buyerApprovedByNote: note || "אושר ע״י רוכש — נרשם ע״י מתאמת",
    },
  });

  await maybeFullyApprove(updated, changeRequestId, projectId);
  revalidatePath(`/projects/${projectId}/requests/${changeRequestId}`);
}

export async function recordDeveloperApproval(formData: FormData) {
  const projectId = String(formData.get("projectId") || "");
  const quoteId = String(formData.get("quoteId") || "");
  const changeRequestId = String(formData.get("changeRequestId") || "");
  const note = String(formData.get("note") || "").trim();

  const quote = await prisma.quote.findFirst({ where: { id: quoteId, projectId } });
  if (!quote) throw new Error("הצעה לא נמצאה");

  const updated = await prisma.quote.update({
    where: { id: quoteId },
    data: {
      developerApprovedAt: new Date(),
      developerApprovedByNote: note || "אושר ע״י יזם/קבלן — נרשם ע״י מתאמת",
    },
  });

  await maybeFullyApprove(updated, changeRequestId, projectId);
  revalidatePath(`/projects/${projectId}/requests/${changeRequestId}`);
}

async function maybeFullyApprove(
  quote: {
    id: string;
    buyerApprovedAt: Date | null;
    developerApprovedAt: Date | null;
  },
  changeRequestId: string,
  projectId: string,
) {
  if (quote.buyerApprovedAt && quote.developerApprovedAt) {
    await prisma.quote.update({
      where: { id: quote.id },
      data: { status: "approved" },
    });
    await prisma.changeRequest.update({
      where: { id: changeRequestId },
      data: { status: "approved" },
    });
    revalidatePath(`/projects/${projectId}/reports`);
  }
}
