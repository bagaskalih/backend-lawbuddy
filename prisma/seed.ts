const { PrismaClient } = require("@prisma/client");
const { hash } = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");
  const admin = await prisma.user.create({
    data: {
      name: "Admin Admin",
      email: "admin@lawbuddy.com",
      password: await hash("admin123", 10),
      role: "ADMIN",
    },
  });

  // Create regular user
  const user = await prisma.user.create({
    data: {
      name: "John Doe",
      email: "john@example.com",
      password: await hash("user123", 10),
      role: "USER",
    },
  });

  // Create a lawyer
  const lawyer = await prisma.user.create({
    data: {
      name: "Jane Lawyer",
      email: "jane@lawfirm.com",
      password: await hash("user123", 10),
      role: "LAWYER",
      field: "Criminal Law",
      experienceYears: 5,
      rating: 4.8,
      price: 150,
      reservedDates: [
        new Date("2025-06-01T09:00:00Z"),
        new Date("2025-06-01T10:00:00Z"),
      ],
    },
  });

  // Create an article
  const article = await prisma.artikel.create({
    data: {
      title: "Legal Tips for First-Time Clients",
      content: "Always consult before you sign.",
      authorId: lawyer.id,
      category: "Legal Advice",
    },
  });

  // Create a comment
  await prisma.comment.create({
    data: {
      content: "Very helpful, thank you!",
      artikelId: article.id,
      authorId: user.id,
    },
  });

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
