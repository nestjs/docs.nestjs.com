import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SchematicsCollectionComponent } from './collection.component';

describe('SchematicsCollectionComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [ SchematicsCollectionComponent ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<SchematicsCollectionComponent>;
  let component: SchematicsCollectionComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(SchematicsCollectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
