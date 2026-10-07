import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";
const db = new PrismaClient();
if (process.env.NODE_ENV === "production")
  throw new Error("Demo seed is forbidden in production");
const password = process.env.SEED_PASSWORD ?? "AuraLocalDemo2026!";
const hash = () => {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
};
const owner = await db.user.upsert({
  where: { email: "owner@aura.local" },
  create: {
    id: "owner",
    email: "owner@aura.local",
    name: "Aura Owner",
    role: "SUPER_ADMIN",
    passwordHash: hash(),
    contentEdit: true,
    joinedAt: new Date("2026-01-01"),
  },
  update: {},
});
const leader = await db.user.upsert({
  where: { email: "lead@aura.local" },
  create: {
    id: "team-lead",
    email: "lead@aura.local",
    name: "Nino Demo",
    role: "TEAM_LEAD",
    passwordHash: hash(),
    contentEdit: false,
    joinedAt: new Date("2026-01-01"),
  },
  update: {},
});
const team = await db.team.upsert({
  where: { leadId: leader.id },
  create: { id: "tbilisi-team", name: "Tbilisi team", leadId: leader.id },
  update: {},
});
await db.user.update({ where: { id: leader.id }, data: { teamId: team.id } });
const agent = await db.user.upsert({
  where: { email: "agent@aura.local" },
  create: {
    id: "agent",
    email: "agent@aura.local",
    name: "Luka Demo",
    role: "AGENT",
    teamId: team.id,
    passwordHash: hash(),
    joinedAt: new Date("2026-01-01"),
    publicProfile: true,
    publicData: {
      title: "Property advisor",
      phone: "+995555000000",
      bio: "Demonstration profile",
    },
  },
  update: {},
});
await db.user.upsert({
  where: { email: "editor@aura.local" },
  create: {
    id: "editor",
    email: "editor@aura.local",
    name: "Editorial Demo",
    role: "EDITOR",
    contentEdit: true,
    passwordHash: hash(),
  },
  update: {},
});
await db.user.upsert({
  where: { email: "other-agent@aura.local" },
  create: {
    id: "other-agent",
    email: "other-agent@aura.local",
    name: "Other Agent",
    role: "AGENT",
    teamId: team.id,
    passwordHash: hash(),
  },
  update: {},
});
const languages = ["en", "ka", "ru", "he"];
const projectCopy: any = {
  en: {
    title: "Vake Gardens",
    description:
      "Illustrative residential complex in Tbilisi. Demo inventory for development; not a real offering.",
  },
  ka: {
    title: "ვაკის ბაღები",
    description:
      "საილუსტრაციო საცხოვრებელი კომპლექსი თბილისში. სატესტო მონაცემები.",
  },
  ru: {
    title: "Сады Ваке",
    description:
      "Демонстрационный жилой комплекс в Тбилиси. Не является реальным предложением.",
  },
  he: {
    title: "גני ואקה",
    description: "מתחם מגורים לדוגמה בטביליסי. נתוני הדגמה בלבד.",
  },
};
const buildings = [
  {
    id: "building-a",
    name: "Building A",
    coverImage: "/images/complex-preview.webp",
    floors: [1, 2, 3, 4].map((number) => ({
      id: `floor-${number}`,
      number,
      image: "/preview-plan.svg",
      polygon: [
        [8, 85 - number * 15],
        [90, 85 - number * 15],
        [90, 98 - number * 15],
        [8, 98 - number * 15],
      ],
    })),
  },
];
for (const [id, slug, city, title] of [
  ["vake", "vake-gardens", "Tbilisi", "Preview · Vake Gardens"],
  ["batumi", "batumi-horizon", "Batumi", "Preview · Batumi Horizon"],
]) {
  const translations: any = Object.fromEntries(
    languages.map((l) => [
      l,
      {
        ...projectCopy[l],
        title: l === "en" ? title : projectCopy[l].title,
        reviewed: true,
      },
    ]),
  );
  await db.project.upsert({
    where: { slug },
    create: {
      id,
      slug,
      city,
      coverImage: "/images/complex-preview.webp",
      translations,
      buildings,
      published: true,
    },
    update: {
      translations,
      buildings,
      coverImage: "/images/complex-preview.webp",
    },
  });
  for (let floor = 1; floor <= 4; floor++) {
    for (let n = 1; n <= 3; n++) {
      const unitId = `${id}-${floor}-${n}`;
      await db.unit.upsert({
        where: { id: unitId },
        create: {
          id: unitId,
          projectId: id,
          buildingId: "building-a",
          floorId: `floor-${floor}`,
          number: `${floor}0${n}`,
          area: 55 + n * 12,
          bedrooms: n,
          price: 180000 + n * 30000,
          priceCurrency: "GEL",
          minimumPrice: 160000 + n * 30000,
          minimumCurrency: "GEL",
          polygon: [
            [5 + (n - 1) * 30, 10],
            [30 + (n - 1) * 30, 10],
            [30 + (n - 1) * 30, 90],
            [5 + (n - 1) * 30, 90],
          ],
          status: floor === 4 && n === 3 ? "SOLD" : "AVAILABLE",
        },
        update: {},
      });
    }
  }
}
const customer = await db.customer.upsert({
  where: { phone: "+995555111222" },
  create: {
    id: "demo-customer",
    name: "Demo Buyer",
    phone: "+995555111222",
    nationality: "Georgia",
  },
  update: {},
});
await db.lead.upsert({
  where: { id: "demo-lead" },
  create: {
    id: "demo-lead",
    customerId: customer.id,
    teamId: team.id,
    agentId: agent.id,
    source: "WEBSITE",
    projectIds: ["vake"],
    stage: "NEW",
  },
  update: {},
});
await db.fxRate.upsert({
  where: { date: "2026-10-06" },
  create: {
    date: "2026-10-06",
    usdGel: 2.7,
    source: "Development illustrative rate; not verified market data",
  },
  update: {},
});
await db.schedule.upsert({
  where: { userId: agent.id },
  create: {
    userId: agent.id,
    weekdays: [1, 2, 3, 4, 5],
    approved: true,
    createdBy: leader.id,
  },
  update: {},
});
await db.post.upsert({
  where: { slug: "buying-in-georgia" },
  create: {
    slug: "buying-in-georgia",
    published: true,
    publishedAt: new Date(),
    translations: Object.fromEntries(
      languages.map((l) => [
        l,
        {
          title: projectCopy[l].title,
          body: projectCopy[l].description,
          reviewed: true,
        },
      ]),
    ),
  },
  update: {},
});
await db.$disconnect();
console.log(
  "Seeded illustrative local data. Login emails: owner@aura.local, lead@aura.local, agent@aura.local, editor@aura.local. Password supplied by SEED_PASSWORD (local default documented).",
);
