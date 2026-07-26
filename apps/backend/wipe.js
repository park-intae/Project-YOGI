const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.plan.deleteMany({})
  .then(() => console.log('Database plans wiped'))
  .catch(console.error)
  .finally(() => p.$disconnect());
