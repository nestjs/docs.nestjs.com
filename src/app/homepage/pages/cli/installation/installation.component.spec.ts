import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CliInstallationComponent } from './installation.component';

describe('CliInstallationComponent', () => {
  let component: CliInstallationComponent;
  let fixture: ComponentFixture<CliInstallationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CliInstallationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CliInstallationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
