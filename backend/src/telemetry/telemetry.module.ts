import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TelemetryService } from './telemetry.service';
import { CrawlerService } from './crawler.service';

@Module({
  imports: [HttpModule],
  providers: [TelemetryService, CrawlerService],
  exports: [TelemetryService, CrawlerService],
})
export class TelemetryModule {}
