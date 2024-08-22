import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataSourceSelectComponent } from './data-source-select.component';

describe('DataSourceSelectComponent', () => {
  let component: DataSourceSelectComponent;
  let fixture: ComponentFixture<DataSourceSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DataSourceSelectComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DataSourceSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
