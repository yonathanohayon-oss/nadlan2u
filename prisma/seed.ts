import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

const DEKEL_SAMPLE = [
  {
    code: "DK-EL-01",
    chapter: "חשמל",
    description: "העברת נקודת חשמל",
    unit: "יח'",
    unitPrice: 280,
  },
  {
    code: "DK-EL-02",
    chapter: "חשמל",
    description: "הוספת נקודת תאורה",
    unit: "יח'",
    unitPrice: 320,
  },
  {
    code: "DK-PL-01",
    chapter: "אינסטלציה",
    description: "הזזת נקודת מים קרים",
    unit: "יח'",
    unitPrice: 450,
  },
  {
    code: "DK-PL-02",
    chapter: "אינסטלציה",
    description: "הוספת נקודת ביוב",
    unit: "יח'",
    unitPrice: 680,
  },
  {
    code: "DK-CR-01",
    chapter: "נגרות",
    description: "שינוי מפרט מטבח — תוספת יחידת ארון",
    unit: "מ\"א",
    unitPrice: 1250,
  },
  {
    code: "DK-FL-01",
    chapter: "ריצוף",
    description: "שדרוג ריצוף לגרניט פורצלן",
    unit: "מ\"ר",
    unitPrice: 95,
  },
  {
    code: "DK-AC-01",
    chapter: "מיזוג",
    description: "הזזת יחידת מיזוג פנימית",
    unit: "יח'",
    unitPrice: 1100,
  },
  {
    code: "DK-DR-01",
    chapter: "דלתות",
    description: "שדרוג דלת פנים",
    unit: "יח'",
    unitPrice: 1850,
  },
];

async function seedProject(input: {
  name: string;
  developerName: string;
  contractorName: string;
  notes: string;
  buildings: { name: string; units: { number: string; floor: string; buyer: { name: string; phone: string; email: string } }[] }[];
  suppliers: { name: string; specialty: string; phone: string }[];
}) {
  const project = await prisma.project.create({
    data: {
      name: input.name,
      developerName: input.developerName,
      contractorName: input.contractorName,
      notes: input.notes,
    },
  });

  for (const item of DEKEL_SAMPLE) {
    await prisma.priceMatrixItem.create({
      data: { projectId: project.id, ...item },
    });
  }

  const suppliers = [];
  for (const s of input.suppliers) {
    suppliers.push(
      await prisma.supplier.create({
        data: { projectId: project.id, ...s },
      }),
    );
  }

  const createdUnits: { unitId: string; buyerId: string; label: string }[] = [];

  for (const b of input.buildings) {
    const building = await prisma.building.create({
      data: { projectId: project.id, name: b.name },
    });
    for (const u of b.units) {
      const unit = await prisma.unit.create({
        data: { buildingId: building.id, number: u.number, floor: u.floor },
      });
      const buyer = await prisma.buyer.create({
        data: {
          projectId: project.id,
          unitId: unit.id,
          name: u.buyer.name,
          phone: u.buyer.phone,
          email: u.buyer.email,
        },
      });
      createdUnits.push({
        unitId: unit.id,
        buyerId: buyer.id,
        label: `${b.name} דירה ${u.number}`,
      });
    }
  }

  return { project, suppliers, createdUnits };
}

async function main() {
  const uploads = path.join(process.cwd(), "data", "uploads");
  fs.mkdirSync(uploads, { recursive: true });

  await prisma.billingDocument.deleteMany();
  await prisma.document.deleteMany();
  await prisma.quoteLine.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.task.deleteMany();
  await prisma.changeRequest.deleteMany();
  await prisma.priceMatrixItem.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.buyer.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.building.deleteMany();
  await prisma.project.deleteMany();

  const a = await seedProject({
    name: "רמת גן גנים",
    developerName: "יזמות השרון בע״מ",
    contractorName: "קבלן בונה בע״מ",
    notes: "פרויקט דמו — בידוד נתונים מלא מול פרויקטים אחרים",
    buildings: [
      {
        name: "בניין א׳",
        units: [
          {
            number: "12",
            floor: "3",
            buyer: {
              name: "נועה כהן",
              phone: "050-1112233",
              email: "noa@example.com",
            },
          },
          {
            number: "15",
            floor: "4",
            buyer: {
              name: "יוסי לוי",
              phone: "052-4445566",
              email: "yossi@example.com",
            },
          },
        ],
      },
      {
        name: "בניין ב׳",
        units: [
          {
            number: "7",
            floor: "2",
            buyer: {
              name: "מיכל אברהם",
              phone: "054-7778899",
              email: "michal@example.com",
            },
          },
        ],
      },
    ],
    suppliers: [
      { name: "אלקטרו-פלוס", specialty: "חשמל", phone: "03-5550101" },
      { name: "אינסטלציה זהב", specialty: "אינסטלציה", phone: "03-5550202" },
      { name: "נגרות דקל", specialty: "נגרות", phone: "03-5550303" },
    ],
  });

  const b = await seedProject({
    name: "תל אביב נוף הים",
    developerName: "ים נדל״ן",
    contractorName: "בוני החוף",
    notes: "פרויקט שני להדגמת הפרדה קשיחה",
    buildings: [
      {
        name: "מגדל 1",
        units: [
          {
            number: "401",
            floor: "4",
            buyer: {
              name: "דניאל שמעון",
              phone: "050-9998877",
              email: "daniel@example.com",
            },
          },
        ],
      },
    ],
    suppliers: [
      { name: "מיזוג צפון", specialty: "מיזוג", phone: "04-5550404" },
    ],
  });

  const cr = await prisma.changeRequest.create({
    data: {
      projectId: a.project.id,
      unitId: a.createdUnits[0].unitId,
      buyerId: a.createdUnits[0].buyerId,
      title: "הזזת נקודות חשמל במטבח + שדרוג ריצוף",
      description: "הרוכשת מבקשת העברת 2 נקודות חשמל ושדרוג ריצוף בסלון.",
      status: "open",
      notes: "נקלט בשיחת טלפון עם הרוכשת",
    },
  });

  await prisma.task.create({
    data: {
      projectId: a.project.id,
      changeRequestId: cr.id,
      title: "לבדוק מול מנהל עבודה אפשרות הזזת נקודות",
      notes: "לפני בניית הצעת מחיר",
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: "open",
    },
  });

  await prisma.task.create({
    data: {
      projectId: a.project.id,
      title: "לעדכן יזם בסטטוס כללי של שינויים",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: "open",
    },
  });

  await prisma.changeRequest.create({
    data: {
      projectId: b.project.id,
      unitId: b.createdUnits[0].unitId,
      buyerId: b.createdUnits[0].buyerId,
      title: "הזזת יחידת מיזוג",
      description: "בקשה להזזת יחידה פנימית בחדר שינה.",
      status: "open",
    },
  });

  const sampleDoc = path.join(uploads, "sample-request-note.txt");
  fs.writeFileSync(
    sampleDoc,
    "מסמך דמו: סיכום בקשת שינוי מדירה 12 — העברת נקודות חשמל ושדרוג ריצוף.\n",
    "utf8",
  );

  await prisma.document.create({
    data: {
      projectId: a.project.id,
      changeRequestId: cr.id,
      name: "סיכום בקשה ראשוני",
      filename: "sample-request-note.txt",
      mimeType: "text/plain",
      storagePath: sampleDoc,
    },
  });

  console.log("Seeded projects:", a.project.name, "and", b.project.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
