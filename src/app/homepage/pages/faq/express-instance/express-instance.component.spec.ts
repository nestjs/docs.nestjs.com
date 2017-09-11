import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpressInstanceComponent } from './express-instance.component';

describe('ExpressInstanceComponent', () => {
  let component: ExpressInstanceComponent;
  let fixture: ComponentFixture<ExpressInstanceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExpressInstanceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpressInstanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
