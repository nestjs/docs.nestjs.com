import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SchematicsUsagesComponent } from './usages.component';

describe('SchematicsUsagesComponent', () => {
  let component: SchematicsUsagesComponent;
  let fixture: ComponentFixture<SchematicsUsagesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SchematicsUsagesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SchematicsUsagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});
