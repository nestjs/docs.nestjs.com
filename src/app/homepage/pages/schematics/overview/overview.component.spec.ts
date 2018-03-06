import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SchematicsOverviewComponent } from './overview.component';

describe('SchematicsOverviewComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [ SchematicsOverviewComponent ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<SchematicsOverviewComponent>;
  let component: SchematicsOverviewComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(SchematicsOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
