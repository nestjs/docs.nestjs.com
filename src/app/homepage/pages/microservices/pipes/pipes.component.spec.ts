import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MicroservicesPipesComponent } from './pipes.component';

describe('MicroservicesPipesComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [ MicroservicesPipesComponent ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<MicroservicesPipesComponent>;
  let component: MicroservicesPipesComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(MicroservicesPipesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
