import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TerminusComponent } from './terminus.component';

describe('TerminusComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [ TerminusComponent ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<TerminusComponent>;
  let component: TerminusComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(TerminusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
