import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CircularDependencyComponent } from './circular-dependency.component';
import { TabsComponent } from '../../../../shared/components/tabs/tabs.component';
import { ExtensionPipe } from '../../../../shared/pipes/extension.pipe';

describe('CircularDependencyComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [
        TabsComponent,
        ExtensionPipe,
        CircularDependencyComponent
      ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<CircularDependencyComponent>;
  let component: CircularDependencyComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(CircularDependencyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
