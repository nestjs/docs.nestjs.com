import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SchematicsComponent } from './schematics.component';

describe('SchematicsComponent', () => {
  let component: SchematicsComponent;
  let fixture: ComponentFixture<SchematicsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SchematicsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SchematicsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
