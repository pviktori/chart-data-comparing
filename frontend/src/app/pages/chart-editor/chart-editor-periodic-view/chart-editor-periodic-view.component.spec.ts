import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartEditorPeriodicViewComponent } from './chart-editor-periodic-view.component';

describe('ChartEditorPeriodicViewComponent', () => {
  let component: ChartEditorPeriodicViewComponent;
  let fixture: ComponentFixture<ChartEditorPeriodicViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChartEditorPeriodicViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChartEditorPeriodicViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
