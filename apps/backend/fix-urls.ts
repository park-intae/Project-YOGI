import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const plans = await prisma.plan.findMany({
    where: {
      planUrl: {
        contains: 'srch_telecomcd'
      }
    }
  });
  console.log(`Found ${plans.length} plans with 'srch_telecomcd'`);
  
  let count = 0;
  for (const plan of plans) {
    if (plan.planUrl) {
      const newUrl = plan.planUrl.replace('srch_telecomcd', 'telecomcd');
      await prisma.plan.update({
        where: { id: plan.id },
        data: { planUrl: newUrl }
      });
      count++;
    }
  }
  console.log(`Updated ${count} plans to use 'telecomcd'`);
}
run().finally(() => prisma.$disconnect());
