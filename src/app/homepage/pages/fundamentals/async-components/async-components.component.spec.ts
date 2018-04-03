import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AsyncComponentsComponent } from './async-components.component';

describe('AsyncComponentsComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [ AsyncComponentsComponent ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<AsyncComponentsComponent>;
  let component: AsyncComponentsComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(AsyncComponentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
