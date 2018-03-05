import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MockgooseComponent } from './mockgoose.component';

describe('MockgooseComponent', () => {
  let component: MockgooseComponent;
  let fixture: ComponentFixture<MockgooseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MockgooseComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MockgooseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should be created', () => {
    expect(component).toBeTruthy();
  });
});
