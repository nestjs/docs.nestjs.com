import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WsPipesComponent } from './pipes.component';

describe('WsPipesComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [ WsPipesComponent ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<WsPipesComponent>;
  let component: WsPipesComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(WsPipesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
