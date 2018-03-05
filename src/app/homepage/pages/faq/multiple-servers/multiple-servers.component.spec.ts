import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MultipleServersComponent } from './multiple-servers.component';

describe('MultipleServersComponent', () => {
  let component: MultipleServersComponent;
  let fixture: ComponentFixture<MultipleServersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MultipleServersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MultipleServersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should be created', () => {
    expect(component).toBeTruthy();
  });
});
