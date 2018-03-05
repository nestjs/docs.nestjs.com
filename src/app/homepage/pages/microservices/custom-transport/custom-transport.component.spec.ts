import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomTransportComponent } from './custom-transport.component';

describe('CustomTransportComponent', () => {
  let component: CustomTransportComponent;
  let fixture: ComponentFixture<CustomTransportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CustomTransportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomTransportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should be created', () => {
    expect(component).toBeTruthy();
  });
});
