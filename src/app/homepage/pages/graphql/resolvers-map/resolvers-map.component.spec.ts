import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ResolversMapComponent } from './resolvers-map.component';

describe('ResolversMapComponent', () => {
  let component: ResolversMapComponent;
  let fixture: ComponentFixture<ResolversMapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ResolversMapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResolversMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
