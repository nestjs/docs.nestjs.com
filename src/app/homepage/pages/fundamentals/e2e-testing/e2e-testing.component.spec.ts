import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { E2eTestingComponent } from './e2e-testing.component';

describe('E2eTestingComponent', () => {
  let component: E2eTestingComponent;
  let fixture: ComponentFixture<E2eTestingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ E2eTestingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(E2eTestingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should be created', () => {
    expect(component).toBeTruthy();
  });
});
