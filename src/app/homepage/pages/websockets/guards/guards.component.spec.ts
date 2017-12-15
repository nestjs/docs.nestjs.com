import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WsGuardsComponent } from './guards.component';

describe('WsGuardsComponent', () => {
  let component: WsGuardsComponent;
  let fixture: ComponentFixture<WsGuardsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WsGuardsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WsGuardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
