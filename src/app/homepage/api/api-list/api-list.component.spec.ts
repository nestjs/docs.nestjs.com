import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ApiListComponent } from './api-list.component';

describe('ApiListComponent', () => {
  let component: ApiListComponent;
  let fixture: ComponentFixture<ApiListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ApiListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApiListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
