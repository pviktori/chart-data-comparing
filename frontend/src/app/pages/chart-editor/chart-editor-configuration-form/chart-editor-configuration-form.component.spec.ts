import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartEditorConfigurationFormComponent } from './chart-editor-configuration-form.component';

describe('ChartEditorConfigurationFormComponent', () => {
  let component: ChartEditorConfigurationFormComponent;
  let fixture: ComponentFixture<ChartEditorConfigurationFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChartEditorConfigurationFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChartEditorConfigurationFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
