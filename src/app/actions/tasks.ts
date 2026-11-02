"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createTask(formData: FormData) {
  const projectId = String(formData.get("projectId") || "");
  const title = String(formData.get("title") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const dueDateRaw = String(formData.get("dueDate") || "");
  const changeRequestIdRaw = String(formData.get("changeRequestId") || "");
  const changeRequestId = changeRequestIdRaw || null;

  if (!projectId || !title) throw new Error("חסרים שדות");

  if (changeRequestId) {
    const cr = await prisma.changeRequest.findFirst({
      where: { id: changeRequestId, projectId },
    });
    if (!cr) throw new Error("בקשה לא שייכת לפרויקט");
  }

  await prisma.task.create({
    data: {
      projectId,
      title,
      notes,
      changeRequestId,
      dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
      status: "open",
    },
  });

  revalidatePath(`/projects/${projectId}/tasks`);
  if (changeRequestId) {
    revalidatePath(`/projects/${projectId}/requests/${changeRequestId}`);
  }
}

export async function toggleTask(formData: FormData) {
  const projectId = String(formData.get("projectId") || "");
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "") === "done" ? "open" : "done";

  const task = await prisma.task.findFirst({ where: { id, projectId } });
  if (!task) throw new Error("משימה לא נמצאה");

  await prisma.task.update({ where: { id }, data: { status } });
  revalidatePath(`/projects/${projectId}/tasks`);
}
