require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  errorFormat: 'pretty',
});

async function main() {
  try {
    const res = await prisma.module.upsert({
      where: { userId_slug: { userId: '00000000-0000-0000-0000-000000000000', slug: 'test-upsert-order' } },
      create: {
        userId: '00000000-0000-0000-0000-000000000000',
        slug: 'test-upsert-order',
        name: 'Test Upsert',
        description: 'temp',
        active: true,
        config: '{}',
      },
      update: { name: 'Test Upsert' },
    });
    console.log('Upsert success', res);
  } catch (e) {
    console.error('Upsert error', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();