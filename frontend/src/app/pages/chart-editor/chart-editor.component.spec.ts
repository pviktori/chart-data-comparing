import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartEditorComponent } from './chart-editor.component';

describe('ChartEditorComponent', () => {
  let component: ChartEditorComponent;
  let fixture: ComponentFixture<ChartEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChartEditorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ChartEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
