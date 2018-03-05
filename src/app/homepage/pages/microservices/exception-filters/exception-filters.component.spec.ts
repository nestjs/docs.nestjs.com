import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MicroservicesExceptionFiltersComponent } from './exception-filters.component';

describe('MicroservicesExceptionFiltersComponent', () => {
  let component: MicroservicesExceptionFiltersComponent;
  let fixture: ComponentFixture<MicroservicesExceptionFiltersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MicroservicesExceptionFiltersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MicroservicesExceptionFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should be created', () => {
    expect(component).toBeTruthy();
  });
});
