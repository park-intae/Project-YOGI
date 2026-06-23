import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { TelemetryService } from './telemetry.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const telemetryService = app.get(TelemetryService);
  
  try {
    const result = await telemetryService.transform();
    console.log(`Transform Success: ${JSON.stringify(result)}`);
    await app.close();
    process.exit(0);
  } catch (error) {
    console.error(`Transform Failed: ${error.message}`);
    await app.close();
    process.exit(1);
  }
}

bootstrap();
