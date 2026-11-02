"use server";

import fs from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function uploadDocument(formData: FormData) {
  const projectId = String(formData.get("projectId") || "");
  const changeRequestIdRaw = String(formData.get("changeRequestId") || "");
  const quoteIdRaw = String(formData.get("quoteId") || "");
  const name = String(formData.get("name") || "").trim();
  const file = formData.get("file");

  if (!projectId || !name || !(file instanceof File) || file.size === 0) {
    throw new Error("חסרים שדות או קובץ");
  }

  const changeRequestId = changeRequestIdRaw || null;
  const quoteId = quoteIdRaw || null;

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

  const uploadsDir = path.join(process.cwd(), "data", "uploads", projectId);
  await fs.mkdir(uploadsDir, { recursive: true });

  const safeName = file.name.replace(/[^a-zA-Z0-9._\-\u0590-\u05FF]/g, "_");
  const filename = `${Date.now()}-${safeName}`;
  const storagePath = path.join(uploadsDir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(storagePath, buffer);

  await prisma.document.create({
    data: {
      projectId,
      changeRequestId,
      quoteId,
      name,
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      storagePath,
    },
  });

  if (changeRequestId) {
    revalidatePath(`/projects/${projectId}/requests/${changeRequestId}`);
  }
  revalidatePath(`/projects/${projectId}`);
}

export async function uploadMatrixCsv(formData: FormData) {
  const projectId = String(formData.get("projectId") || "");
  const file = formData.get("file");
  if (!projectId || !(file instanceof File)) throw new Error("חסר קובץ");

  const text = await file.text();
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // Expected header: code,chapter,description,unit,unitPrice
  const rows = lines.slice(1);
  let count = 0;
  for (const row of rows) {
    const parts = row.split(",").map((p) => p.trim().replace(/^"|"$/g, ""));
    if (parts.length < 5) continue;
    const [code, chapter, description, unit, priceRaw] = parts;
    const unitPrice = Number(priceRaw);
    if (!code || !description || !Number.isFinite(unitPrice)) continue;

    await prisma.priceMatrixItem.upsert({
      where: { projectId_code: { projectId, code } },
      create: {
        projectId,
        code,
        chapter: chapter || "כללי",
        description,
        unit: unit || "יח'",
        unitPrice,
        source: "csv-upload",
      },
      update: {
        chapter: chapter || "כללי",
        description,
        unit: unit || "יח'",
        unitPrice,
        source: "csv-upload",
      },
    });
    count += 1;
  }

  revalidatePath(`/projects/${projectId}/matrix`);
  void count;
}
