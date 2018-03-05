import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { E2eTestingComponent } from './e2e-testing.component';
import { TabsComponent } from '../../../../shared/components/tabs/tabs.component';
import { ExtensionPipe } from '../../../../shared/pipes/extension.pipe';

describe('E2eTestingComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [
        TabsComponent,
        ExtensionPipe,
        E2eTestingComponent
      ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<E2eTestingComponent>;
  let component: E2eTestingComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(E2eTestingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
