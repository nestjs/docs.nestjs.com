import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SchematicsCollectionComponent } from './collection.component';

describe('SchematicsCollectionComponent', () => {
  let component: SchematicsCollectionComponent;
  let fixture: ComponentFixture<SchematicsCollectionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SchematicsCollectionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SchematicsCollectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
