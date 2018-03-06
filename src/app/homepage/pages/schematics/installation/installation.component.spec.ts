import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SchematicsInstallationComponent } from './installation.component';

describe('SchematicsInstallationComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [ SchematicsInstallationComponent ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<SchematicsInstallationComponent>;
  let component: SchematicsInstallationComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(SchematicsInstallationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
