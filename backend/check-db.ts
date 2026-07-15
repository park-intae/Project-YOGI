import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const plans = await prisma.plan.findMany({ select: { planName: true, planUrl: true }});
  console.log('Total plans:', plans.length);
  const empty = plans.filter(p => !p.planUrl || p.planUrl === '#').length;
  console.log('Plans with empty/null URLs:', empty);
  console.log('Sample empty plans:', plans.filter(p => !p.planUrl || p.planUrl === '#').slice(0, 5));
  console.log('Sample filled plans:', plans.filter(p => p.planUrl && p.planUrl !== '#').slice(0, 5));
}
run().finally(() => prisma.$disconnect());
