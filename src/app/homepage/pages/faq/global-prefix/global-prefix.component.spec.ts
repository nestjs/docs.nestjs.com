import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GlobalPrefixComponent } from './global-prefix.component';

describe('GlobalPrefixComponent', () => {
  let component: GlobalPrefixComponent;
  let fixture: ComponentFixture<GlobalPrefixComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GlobalPrefixComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GlobalPrefixComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
