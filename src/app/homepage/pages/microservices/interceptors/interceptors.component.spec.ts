import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MicroservicesInterceptorsComponent } from './interceptors.component';

describe('MicroservicesInterceptorsComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [ MicroservicesInterceptorsComponent ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<MicroservicesInterceptorsComponent>;
  let component: MicroservicesInterceptorsComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(MicroservicesInterceptorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
