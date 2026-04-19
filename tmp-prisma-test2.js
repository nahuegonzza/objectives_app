const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const user = await prisma.user.findFirst({ where: { email: 'testuser@example.com' } });
    console.log('user', user);
  } catch (error) {
    console.error('prisma error', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();