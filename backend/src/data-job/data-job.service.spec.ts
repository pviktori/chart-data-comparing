import { Test, TestingModule } from '@nestjs/testing';
import { DataJobService } from './data-job.service';

describe('DataJobService', () => {
  let service: DataJobService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DataJobService],
    }).compile();

    service = module.get<DataJobService>(DataJobService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
