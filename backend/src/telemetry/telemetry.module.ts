import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TelemetryService } from './telemetry.service';

@Module({
  imports: [HttpModule],
  providers: [TelemetryService],
  exports: [TelemetryService],
})
export class TelemetryModule {}
