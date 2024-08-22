import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectDatabaseComponent } from './select-database.component';


describe('SelectDatabaseComponent', () => {
  let component: SelectDatabaseComponent;
  let fixture: ComponentFixture<SelectDatabaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SelectDatabaseComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectDatabaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
