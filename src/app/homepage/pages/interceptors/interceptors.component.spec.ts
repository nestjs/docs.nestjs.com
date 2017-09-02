import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InterceptorsComponent } from './interceptors.component';

describe('InterceptorsComponent', () => {
  let component: InterceptorsComponent;
  let fixture: ComponentFixture<InterceptorsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InterceptorsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InterceptorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
