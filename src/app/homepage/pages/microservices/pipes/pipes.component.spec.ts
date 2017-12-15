import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MicroservicesPipesComponent } from './pipes.component';

describe('MicroservicesPipesComponent', () => {
  let component: MicroservicesPipesComponent;
  let fixture: ComponentFixture<MicroservicesPipesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MicroservicesPipesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MicroservicesPipesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
