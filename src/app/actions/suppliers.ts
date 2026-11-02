"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createSupplier(formData: FormData) {
  const projectId = String(formData.get("projectId") || "");
  const name = String(formData.get("name") || "").trim();
  const specialty = String(formData.get("specialty") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!projectId || !name) throw new Error("חסרים שדות");

  await prisma.supplier.create({
    data: { projectId, name, specialty, phone, email, notes },
  });

  revalidatePath(`/projects/${projectId}/suppliers`);
}
