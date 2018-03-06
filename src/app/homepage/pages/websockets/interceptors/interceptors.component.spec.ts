import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WsInterceptorsComponent } from './interceptors.component';

describe('WsInterceptorsComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [ WsInterceptorsComponent ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<WsInterceptorsComponent>;
  let component: WsInterceptorsComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(WsInterceptorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
