import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SchematicsInstallationComponent } from './installation.component';

describe('SchematicsInstallationComponent', () => {
  let component: SchematicsInstallationComponent;
  let fixture: ComponentFixture<SchematicsInstallationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SchematicsInstallationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SchematicsInstallationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
