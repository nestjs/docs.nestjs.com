import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlatformAgnosticismComponent } from './platform-agnosticism.component';

describe('PlatformAgnosticismComponent', () => {
  let component: PlatformAgnosticismComponent;
  let fixture: ComponentFixture<PlatformAgnosticismComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PlatformAgnosticismComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlatformAgnosticismComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
