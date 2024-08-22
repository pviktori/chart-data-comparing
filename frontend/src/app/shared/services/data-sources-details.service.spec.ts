import { TestBed } from '@angular/core/testing';

import { DataSourcesDetailsService } from './data-sources-details.service';

describe('DataSourcesDetailsService', () => {
  let service: DataSourcesDetailsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataSourcesDetailsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
