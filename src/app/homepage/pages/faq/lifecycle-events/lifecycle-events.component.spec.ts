import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LifecycleEventsComponent } from './lifecycle-events.component';
import { TabsComponent } from '../../../../shared/components/tabs/tabs.component';
import { ExtensionPipe } from '../../../../shared/pipes/extension.pipe';

describe('LifecycleEventsComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [
        TabsComponent,
        ExtensionPipe,
        LifecycleEventsComponent
      ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<LifecycleEventsComponent>;
  let component: LifecycleEventsComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(LifecycleEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
