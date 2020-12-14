import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SocialWrapperComponent } from './social-wrapper.component';

describe('SocialWrapperComponent', () => {
  let component: SocialWrapperComponent;
  let fixture: ComponentFixture<SocialWrapperComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SocialWrapperComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SocialWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
