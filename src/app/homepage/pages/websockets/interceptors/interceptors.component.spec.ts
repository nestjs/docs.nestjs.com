import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WsInterceptorsComponent } from './interceptors.component';

describe('WsInterceptorsComponent', () => {
  let component: WsInterceptorsComponent;
  let fixture: ComponentFixture<WsInterceptorsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WsInterceptorsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WsInterceptorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should be created', () => {
    expect(component).toBeTruthy();
  });
});
