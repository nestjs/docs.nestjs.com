import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MicroservicesGuardsComponent } from './guards.component';

describe('MicroservicesGuardsComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [ MicroservicesGuardsComponent ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<MicroservicesGuardsComponent>;
  let component: MicroservicesGuardsComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(MicroservicesGuardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
