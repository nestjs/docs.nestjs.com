import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WsExceptionFiltersComponent } from './exception-filters.component';

describe('WsExceptionFiltersComponent', () => {
  let component: WsExceptionFiltersComponent;
  let fixture: ComponentFixture<WsExceptionFiltersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WsExceptionFiltersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WsExceptionFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should be created', () => {
    expect(component).toBeTruthy();
  });
});
