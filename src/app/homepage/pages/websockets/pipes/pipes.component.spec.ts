import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WsPipesComponent } from './pipes.component';

describe('WsPipesComponent', () => {
  let component: WsPipesComponent;
  let fixture: ComponentFixture<WsPipesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WsPipesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WsPipesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should be created', () => {
    expect(component).toBeTruthy();
  });
});
