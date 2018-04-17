import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ScalarsComponent } from './scalars.component';

describe('ScalarsComponent', () => {
  let component: ScalarsComponent;
  let fixture: ComponentFixture<ScalarsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ScalarsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ScalarsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
