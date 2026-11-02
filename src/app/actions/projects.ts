"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const DEKEL_SAMPLE = [
  { code: "DK-EL-01", chapter: "חשמל", description: "העברת נקודת חשמל", unit: "יח'", unitPrice: 280 },
  { code: "DK-EL-02", chapter: "חשמל", description: "הוספת נקודת תאורה", unit: "יח'", unitPrice: 320 },
  { code: "DK-PL-01", chapter: "אינסטלציה", description: "הזזת נקודת מים קרים", unit: "יח'", unitPrice: 450 },
  { code: "DK-PL-02", chapter: "אינסטלציה", description: "הוספת נקודת ביוב", unit: "יח'", unitPrice: 680 },
  { code: "DK-CR-01", chapter: "נגרות", description: "שינוי מפרט מטבח — תוספת יחידת ארון", unit: "מ\"א", unitPrice: 1250 },
  { code: "DK-FL-01", chapter: "ריצוף", description: "שדרוג ריצוף לגרניט פורצלן", unit: "מ\"ר", unitPrice: 95 },
  { code: "DK-AC-01", chapter: "מיזוג", description: "הזזת יחידת מיזוג פנימית", unit: "יח'", unitPrice: 1100 },
  { code: "DK-DR-01", chapter: "דלתות", description: "שדרוג דלת פנים", unit: "יח'", unitPrice: 1850 },
];

export async function createProject(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const developerName = String(formData.get("developerName") || "").trim();
  const contractorName = String(formData.get("contractorName") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!name || !developerName || !contractorName) {
    throw new Error("חסרים שדות חובה");
  }

  const project = await prisma.project.create({
    data: { name, developerName, contractorName, notes },
  });

  await prisma.priceMatrixItem.createMany({
    data: DEKEL_SAMPLE.map((item) => ({ projectId: project.id, ...item })),
  });

  revalidatePath("/");
  redirect(`/projects/${project.id}`);
}

export async function createBuilding(formData: FormData) {
  const projectId = String(formData.get("projectId") || "");
  const name = String(formData.get("name") || "").trim();
  if (!projectId || !name) throw new Error("חסרים שדות");

  await prisma.building.create({ data: { projectId, name } });
  revalidatePath(`/projects/${projectId}/units`);
}

export async function createUnitWithBuyer(formData: FormData) {
  const projectId = String(formData.get("projectId") || "");
  const buildingId = String(formData.get("buildingId") || "");
  const number = String(formData.get("number") || "").trim();
  const floor = String(formData.get("floor") || "").trim();
  const buyerName = String(formData.get("buyerName") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();

  if (!projectId || !buildingId || !number || !buyerName) {
    throw new Error("חסרים שדות חובה");
  }

  const building = await prisma.building.findFirst({
    where: { id: buildingId, projectId },
  });
  if (!building) throw new Error("בניין לא שייך לפרויקט");

  const unit = await prisma.unit.create({
    data: { buildingId, number, floor },
  });
  await prisma.buyer.create({
    data: { projectId, unitId: unit.id, name: buyerName, phone, email },
  });

  revalidatePath(`/projects/${projectId}/units`);
}
