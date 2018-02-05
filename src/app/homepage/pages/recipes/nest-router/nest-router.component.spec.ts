import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NestRouterComponent } from './nest-router.component';

describe('NestRouterComponent', () => {
  let component: NestRouterComponent;
  let fixture: ComponentFixture<NestRouterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NestRouterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NestRouterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
