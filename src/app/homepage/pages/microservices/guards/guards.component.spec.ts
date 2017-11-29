import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MicroservicesGuardsComponent } from './guards.component';

describe('MicroservicesGuardsComponent', () => {
  let component: MicroservicesGuardsComponent;
  let fixture: ComponentFixture<MicroservicesGuardsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MicroservicesGuardsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MicroservicesGuardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
