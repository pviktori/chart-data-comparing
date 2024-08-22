import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartEditorLineChartComponent } from './chart-editor-line-chart.component';

describe('LineChartComponent', () => {
  let component: ChartEditorLineChartComponent;
  let fixture: ComponentFixture<ChartEditorLineChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChartEditorLineChartComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChartEditorLineChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
