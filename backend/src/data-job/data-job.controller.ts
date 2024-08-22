import { Controller, Get, HttpException, HttpStatus, Param, Post } from '@nestjs/common';
import { DataJobService } from './data-job.service';

@Controller('data-jobs')
export class DataJobController {
  constructor(private readonly _dataJobService: DataJobService) {}

  @Post(':sessionId')
  createJob(@Param('sessionId') sessionId: string) {
    this._dataJobService.createJob(sessionId);
    return true;
  }

  @Get(':sessionId/status')
  getStatus(@Param('sessionId') sessionId: string) {
    try {
      const status = this._dataJobService.getStatus(sessionId);
      return { status };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Get(':sessionId/data')
  getData(@Param('sessionId') sessionId: string) {
    try {
      const data = this._dataJobService.getData(sessionId);
      return data;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
