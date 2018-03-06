import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WsGuardsComponent } from './guards.component';

describe('WsGuardsComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [ WsGuardsComponent ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<WsGuardsComponent>;
  let component: WsGuardsComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(WsGuardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
