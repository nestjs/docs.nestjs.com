import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpressInstanceComponent } from './express-instance.component';

describe('ExpressInstanceComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [ ExpressInstanceComponent ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<ExpressInstanceComponent>;
  let component: ExpressInstanceComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(ExpressInstanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
