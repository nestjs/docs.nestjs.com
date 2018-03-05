import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SchematicsOverviewComponent } from './overview.component';

describe('SchematicsOverviewComponent', () => {
  let component: SchematicsOverviewComponent;
  let fixture: ComponentFixture<SchematicsOverviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SchematicsOverviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SchematicsOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
