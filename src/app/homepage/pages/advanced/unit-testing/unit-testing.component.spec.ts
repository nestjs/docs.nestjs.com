import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UnitTestingComponent } from './unit-testing.component';

describe('UnitTestingComponent', () => {
  let component: UnitTestingComponent;
  let fixture: ComponentFixture<UnitTestingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UnitTestingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UnitTestingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
