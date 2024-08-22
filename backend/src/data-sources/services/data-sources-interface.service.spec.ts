import { Test, TestingModule } from '@nestjs/testing';
import { DataSourcesInterfaceService } from './data-sources-interface.service';

describe('DataSourcesInterfaceService', () => {
  let service: DataSourcesInterfaceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DataSourcesInterfaceService],
    }).compile();

    service = module.get<DataSourcesInterfaceService>(DataSourcesInterfaceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
