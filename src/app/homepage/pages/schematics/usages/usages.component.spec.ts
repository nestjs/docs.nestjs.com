import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SchematicsUsagesComponent } from './usages.component';

describe('SchematicsUsagesComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [ SchematicsUsagesComponent ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<SchematicsUsagesComponent>;
  let component: SchematicsUsagesComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(SchematicsUsagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
