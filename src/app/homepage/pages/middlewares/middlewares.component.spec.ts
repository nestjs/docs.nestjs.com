import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MiddlewaresComponent } from './middlewares.component';

describe('MiddlewaresComponent', () => {
  let component: MiddlewaresComponent;
  let fixture: ComponentFixture<MiddlewaresComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MiddlewaresComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MiddlewaresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should be created', () => {
    expect(component).toBeTruthy();
  });
});
