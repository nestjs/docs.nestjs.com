import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ComponentsComponent } from './components.component';
import { TabsComponent } from '../../../shared/components/tabs/tabs.component';
import { ExtensionPipe } from '../../../shared/pipes/extension.pipe';

describe('ComponentsComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [
        TabsComponent,
        ExtensionPipe,
        ComponentsComponent
      ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<ComponentsComponent>;
  let component: ComponentsComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(ComponentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
