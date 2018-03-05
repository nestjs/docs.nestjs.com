import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CqrsComponent } from './cqrs.component';

describe('CqrsComponent', () => {
  let component: CqrsComponent;
  let fixture: ComponentFixture<CqrsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CqrsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CqrsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should be created', () => {
    expect(component).toBeTruthy();
  });
});
