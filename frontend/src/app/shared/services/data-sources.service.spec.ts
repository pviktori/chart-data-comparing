import { TestBed } from '@angular/core/testing';

import { DataSourcesService } from './data-sources.service';

describe('DataSourcesService', () => {
  let service: DataSourcesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataSourcesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
