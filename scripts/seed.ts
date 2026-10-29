import { ensureDefaultAdmin } from "../src/lib/seed";
import { seedAcademyCurriculum } from "../src/lib/academy-seed";
import { seedQuestionBank } from "../src/lib/question-bank-seed";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Seeding database...");
  await ensureDefaultAdmin();
  await seedAcademyCurriculum();
  await seedQuestionBank();
  console.log("Database seeded successfully.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
