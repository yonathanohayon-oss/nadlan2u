import { prisma } from "@/lib/prisma";

export async function requireProject(projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new Error("PROJECT_NOT_FOUND");
  }
  return project;
}

/** Ensures a child entity belongs to the given project (hard isolation). */
export async function assertChangeRequestInProject(
  changeRequestId: string,
  projectId: string,
) {
  const cr = await prisma.changeRequest.findFirst({
    where: { id: changeRequestId, projectId },
  });
  if (!cr) throw new Error("CHANGE_REQUEST_NOT_IN_PROJECT");
  return cr;
}

export async function assertQuoteInProject(quoteId: string, projectId: string) {
  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, projectId },
  });
  if (!quote) throw new Error("QUOTE_NOT_IN_PROJECT");
  return quote;
}
