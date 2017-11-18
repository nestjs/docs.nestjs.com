import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PassportComponent } from './passport.component';

describe('PassportComponent', () => {
  let component: PassportComponent;
  let fixture: ComponentFixture<PassportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PassportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PassportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
