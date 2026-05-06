const { prisma } = require('./lib/prisma');
(async () => {
  const modules = await prisma.module.findMany();
  console.log('Total modules:', modules.length);
  console.log('Modules:', modules.map(m => ({
    slug: m.slug,
    active: m.active,
    userId: m.userId,
    order: m.order
  })));
  await prisma.$disconnect();
})();
