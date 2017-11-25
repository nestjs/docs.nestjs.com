import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AsyncComponentsComponent } from './async-components.component';

describe('AsyncComponentsComponent', () => {
  let component: AsyncComponentsComponent;
  let fixture: ComponentFixture<AsyncComponentsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AsyncComponentsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AsyncComponentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
