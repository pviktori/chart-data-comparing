import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlexibleLoadingLayoutComponent } from './flexible-loading-layout.component';

describe('FlexibleLoadingLayoutComponent', () => {
  let component: FlexibleLoadingLayoutComponent;
  let fixture: ComponentFixture<FlexibleLoadingLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FlexibleLoadingLayoutComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FlexibleLoadingLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
