import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { username: "" },
    select: { id: true, email: true },
  });

  console.log(`Backfilling usernames for ${users.length} users...`);

  for (const user of users) {
    const emailPrefix = user.email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_");
    const suffix = user.id.slice(-6);
    const username = `${emailPrefix}_${suffix}`;
    await prisma.user.update({
      where: { id: user.id },
      data: { username },
    });
    console.log(`  ${user.email} → @${username}`);
  }

  console.log("Done.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
