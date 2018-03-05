import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GlobalPrefixComponent } from './global-prefix.component';

describe('GlobalPrefixComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [ GlobalPrefixComponent ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<GlobalPrefixComponent>;
  let component: GlobalPrefixComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(GlobalPrefixComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
