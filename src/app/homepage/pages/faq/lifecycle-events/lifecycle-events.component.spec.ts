import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LifecycleEventsComponent } from './lifecycle-events.component';

describe('LifecycleEventsComponent', () => {
  let component: LifecycleEventsComponent;
  let fixture: ComponentFixture<LifecycleEventsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LifecycleEventsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LifecycleEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
