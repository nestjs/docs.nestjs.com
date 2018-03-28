import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CliOverviewComponent } from './overview.component';

describe('CliOverviewComponent', () => {
  let component: CliOverviewComponent;
  let fixture: ComponentFixture<CliOverviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CliOverviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CliOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
