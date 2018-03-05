import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GuardsInterceptorsComponent } from './guards-interceptors.component';

describe('GuardsInterceptorsComponent', () => {
  let component: GuardsInterceptorsComponent;
  let fixture: ComponentFixture<GuardsInterceptorsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GuardsInterceptorsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GuardsInterceptorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
