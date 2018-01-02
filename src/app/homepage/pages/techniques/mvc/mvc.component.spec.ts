import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MvcComponent } from './mvc.component';

describe('MvcComponent', () => {
  let component: MvcComponent;
  let fixture: ComponentFixture<MvcComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MvcComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MvcComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
