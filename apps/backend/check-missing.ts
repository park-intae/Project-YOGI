import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const plans = await prisma.plan.findMany({
    where: { OR: [{ planUrl: null }, { planUrl: '' }, { planUrl: '#' }] }
  });
  console.log('Plans still missing URLs:');
  plans.forEach(p => console.log(p.planName));
}
run().finally(() => prisma.$disconnect());
