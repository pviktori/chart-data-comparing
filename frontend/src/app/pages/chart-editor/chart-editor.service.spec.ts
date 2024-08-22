import { TestBed } from '@angular/core/testing';

import { ChartEditorService } from './chart-editor.service';

describe('ChartEditorService', () => {
  let service: ChartEditorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChartEditorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
