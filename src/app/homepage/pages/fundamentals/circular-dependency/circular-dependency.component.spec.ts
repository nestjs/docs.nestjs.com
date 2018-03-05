import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CircularDependencyComponent } from './circular-dependency.component';

describe('CircularDependencyComponent', () => {
  let component: CircularDependencyComponent;
  let fixture: ComponentFixture<CircularDependencyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CircularDependencyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CircularDependencyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should be created', () => {
    expect(component).toBeTruthy();
  });
});
