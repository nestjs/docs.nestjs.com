import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MicroservicesInterceptorsComponent } from './interceptors.component';

describe('MicroservicesInterceptorsComponent', () => {
  let component: MicroservicesInterceptorsComponent;
  let fixture: ComponentFixture<MicroservicesInterceptorsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MicroservicesInterceptorsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MicroservicesInterceptorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should be created', () => {
    expect(component).toBeTruthy();
  });
});
