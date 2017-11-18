import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SwaggerComponent } from './swagger.component';

describe('SwaggerComponent', () => {
  let component: SwaggerComponent;
  let fixture: ComponentFixture<SwaggerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SwaggerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SwaggerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
