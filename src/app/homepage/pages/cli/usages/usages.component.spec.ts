import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CliUsagesComponent } from './usages.component';

describe('CliUsagesComponent', () => {
  let component: CliUsagesComponent;
  let fixture: ComponentFixture<CliUsagesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CliUsagesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CliUsagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
