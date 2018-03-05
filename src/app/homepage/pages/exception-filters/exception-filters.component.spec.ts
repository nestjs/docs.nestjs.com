import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExceptionFiltersComponent } from './exception-filters.component';

describe('ExceptionFiltersComponent', () => {
  let component: ExceptionFiltersComponent;
  let fixture: ComponentFixture<ExceptionFiltersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExceptionFiltersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExceptionFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should be created', () => {
    expect(component).toBeTruthy();
  });
});
