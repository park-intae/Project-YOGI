import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CrawlerService } from './telemetry/crawler.service';

async function bootstrap() {
  console.log('Starting standalone crawler execution...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const crawlerService = app.get(CrawlerService);

  try {
    const result = await crawlerService.updatePlanUrls();
    console.log(`\n====================================`);
    console.log(`Crawler Result:`);
    console.log(`- Total Scraped from site: ${result.totalScraped}`);
    console.log(`- Total DB Plans Updated: ${result.updated}`);
    console.log(`- Failed Updates: ${result.failed}`);
    console.log(`====================================\n`);
  } catch (error) {
    console.error('Crawler execution failed:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
