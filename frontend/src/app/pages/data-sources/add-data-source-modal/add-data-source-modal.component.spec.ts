import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddDataSourceModalComponent } from './add-data-source-modal.component';

describe('AddDataSourceModalComponent', () => {
  let component: AddDataSourceModalComponent;
  let fixture: ComponentFixture<AddDataSourceModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddDataSourceModalComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddDataSourceModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
