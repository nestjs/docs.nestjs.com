import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HierarchicalInjectorComponent } from './hierarchical-injector.component';
import { TabsComponent } from '../../../../shared/components/tabs/tabs.component';
import { ExtensionPipe } from '../../../../shared/pipes/extension.pipe';

describe('HierarchicalInjectorComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [
        TabsComponent,
        ExtensionPipe,
        HierarchicalInjectorComponent
      ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<HierarchicalInjectorComponent>;
  let component: HierarchicalInjectorComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(HierarchicalInjectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
