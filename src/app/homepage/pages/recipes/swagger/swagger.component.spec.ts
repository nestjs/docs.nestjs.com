import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SwaggerComponent } from './swagger.component';

describe('SwaggerComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [ SwaggerComponent ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<SwaggerComponent>;
  let component: SwaggerComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(SwaggerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
