# Nadlan2U Clone — שינויי דיירים (MVP)

ממשק עברי RTL ל**מתאמת שינויי דיירים** בלבד. ניהול פרויקטים מבודדים, בקשות שינוי, הצעות ממחירון דקל, אישור כפול (רוכש + יזם/קבלן), מסמכים, משימות, ספקים, תיעוד חיובים ודוחות.

אין פורטל רוכשים, אין AI/טלפוניה/WhatsApp, אין הזמנות רכש, ואין גבייה.

## הרצה מקומית

```bash
npm install
cp .env.example .env   # אם צריך
npm run db:reset       # יוצר SQLite + נתוני דמו
npm run dev            # http://127.0.0.1:43127
```

סקריפטים נוספים:

- `npm run db:push` — סנכרון סכמה
- `npm run db:seed` — מילוי נתוני דמו מחדש

## נתיב שמח (happy path)

1. בחרו פרויקט דמו (למשל **רמת גן גנים**)
2. פתחו בקשת שינוי קיימת או צרו חדשה מדירה
3. בנו הצעת מחיר מסעיפי מחירון דקל
4. שלחו לאישור כפול ורשמו אישור רוכש + יזם/קבלן
5. שייכו ספק ועדכנו סטטוס ביצוע
6. צרפו מסמך, הוסיפו משימה, תעדו חיוב, בדקו דוח

## הנחות סטטוסים (מינימליות ל-MVP)

| ישות | ערכים |
|------|--------|
| בקשת שינוי | `open` → `in_pricing` → `pending_approval` → `approved` → `in_execution` → `done` / `cancelled` |
| הצעה | `draft` → `pending_approval` → `approved` / `rejected` |
| ביצוע | `not_started` → `in_progress` → `done` |
| משימה | `open` / `done` |
| מסמך חיוב | `payment_request` (דרישת תשלום) / `invoice_record` (תיעוד חשבונית) |

## טכנולוגיה

Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + Prisma + SQLite.

קבצים מועלים נשמרים תחת `data/uploads/` (מקומי).
