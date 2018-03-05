import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickStartComponent } from './quick-start.component';
import { TabsComponent } from '../../../../shared/components/tabs/tabs.component';
import { ExtensionPipe } from '../../../../shared/pipes/extension.pipe';

describe('QuickStartComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [
        TabsComponent,
        ExtensionPipe,
        QuickStartComponent
      ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<QuickStartComponent>;
  let component: QuickStartComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(QuickStartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
