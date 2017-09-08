import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GuardsComponent } from './guards.component';

describe('GuardsComponent', () => {
  let component: GuardsComponent;
  let fixture: ComponentFixture<GuardsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GuardsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GuardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
