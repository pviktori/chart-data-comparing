import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadCsvModalComponent } from './upload-csv-modal.component';

describe('UploadCsvModalComponent', () => {
  let component: UploadCsvModalComponent;
  let fixture: ComponentFixture<UploadCsvModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UploadCsvModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadCsvModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
