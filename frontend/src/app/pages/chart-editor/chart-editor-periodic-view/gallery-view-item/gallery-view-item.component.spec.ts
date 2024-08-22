import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GalleryViewItemComponent } from './gallery-view-item.component';

describe('GalleryViewItemComponent', () => {
  let component: GalleryViewItemComponent;
  let fixture: ComponentFixture<GalleryViewItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GalleryViewItemComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GalleryViewItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
