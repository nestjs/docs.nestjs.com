import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HybridApplicationComponent } from './hybrid-application.component';

describe('HybridApplicationComponent', () => {
  let component: HybridApplicationComponent;
  let fixture: ComponentFixture<HybridApplicationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HybridApplicationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HybridApplicationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should be created', () => {
    expect(component).toBeTruthy();
  });
});
