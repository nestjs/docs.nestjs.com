import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MultipleServersComponent } from './multiple-servers.component';

describe('MultipleServersComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [ MultipleServersComponent ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<MultipleServersComponent>;
  let component: MultipleServersComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(MultipleServersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
