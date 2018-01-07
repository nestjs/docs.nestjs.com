import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SentryComponent } from './sentry.component';

describe('SentryComponent', () => {
  let component: SentryComponent;
  let fixture: ComponentFixture<SentryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SentryComponent ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SentryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
