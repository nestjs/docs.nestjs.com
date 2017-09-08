import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GatewaysComponent } from './gateways.component';

describe('GatewaysComponent', () => {
  let component: GatewaysComponent;
  let fixture: ComponentFixture<GatewaysComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GatewaysComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GatewaysComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
