import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function run() {
  const scrapedPlans = JSON.parse(fs.readFileSync('scraped.json', 'utf-8'));
  const dbPlans = await prisma.plan.findMany();
  
  for (const scraped of scrapedPlans) {
    const scrapedNameRaw = scraped.title;
    const normalizedScrapedName = scrapedNameRaw.replace(/\s+/g, '').replace(/[+]+/g, '');
    
    if (scrapedNameRaw.includes('이야기 5GB')) {
      console.log('--- Checking scraped:', scrapedNameRaw, normalizedScrapedName);
    }

    const matchedDbPlan = dbPlans.find((p) => {
      const normalizedDbName = p.planName.replace(/\s+/g, '').replace(/[+]+/g, '');
      const match = normalizedScrapedName.includes(normalizedDbName) || normalizedDbName.includes(normalizedScrapedName);
      if (match && scrapedNameRaw.includes('이야기 5GB')) {
        console.log('    -> Matched with DB:', p.planName, normalizedDbName);
      }
      return match;
    });
  }
}
run().finally(() => prisma.$disconnect());
