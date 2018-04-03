import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HybridApplicationComponent } from './hybrid-application.component';

describe('HybridApplicationComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [ HybridApplicationComponent ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<HybridApplicationComponent>;
  let component: HybridApplicationComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(HybridApplicationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
