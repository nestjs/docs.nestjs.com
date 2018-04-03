import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FirstStepsComponent } from './first-steps.component';
import { TabsComponent } from '../../../shared/components/tabs/tabs.component';
import { ExtensionPipe } from '../../../shared/pipes/extension.pipe';

describe('FirstStepsComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [
        TabsComponent,
        ExtensionPipe,
        FirstStepsComponent
      ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<FirstStepsComponent>;
  let component: FirstStepsComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(FirstStepsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
