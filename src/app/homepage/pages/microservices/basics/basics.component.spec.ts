import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BasicsComponent } from './basics.component';

describe('BasicsComponent', () => {
  let component: BasicsComponent;
  let fixture: ComponentFixture<BasicsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BasicsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BasicsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
