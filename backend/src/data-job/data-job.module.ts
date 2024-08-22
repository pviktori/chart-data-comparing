import { Module } from '@nestjs/common';
import { DataJobController } from './data-job.controller';
import { DataJobService } from './data-job.service';

@Module({
  controllers: [DataJobController],
  providers: [DataJobService],
  exports: [DataJobService],
})
export class DataJobModule {}
