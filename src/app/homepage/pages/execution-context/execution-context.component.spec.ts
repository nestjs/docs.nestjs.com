import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExecutionContextComponent } from './execution-context.component';

describe('ExecutionContextComponent', () => {
  let component: ExecutionContextComponent;
  let fixture: ComponentFixture<ExecutionContextComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExecutionContextComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExecutionContextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
