import { Test, TestingModule } from '@nestjs/testing';
import { DataJobController } from './data-job.controller';

describe('DataJobController', () => {
  let controller: DataJobController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DataJobController],
    }).compile();

    controller = module.get<DataJobController>(DataJobController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
