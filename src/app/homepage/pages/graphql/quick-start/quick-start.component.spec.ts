import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickStartComponent } from './quick-start.component';

describe('QuickStartComponent', () => {
  let component: QuickStartComponent;
  let fixture: ComponentFixture<QuickStartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ QuickStartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QuickStartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
