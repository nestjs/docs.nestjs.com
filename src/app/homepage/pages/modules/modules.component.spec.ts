import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ModulesComponent } from './modules.component';
import { TabsComponent } from '../../../shared/components/tabs/tabs.component';
import { ExtensionPipe } from '../../../shared/pipes/extension.pipe';

describe('ModulesComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [
        TabsComponent,
        ExtensionPipe,
        ModulesComponent
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModulesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  let fixture: ComponentFixture<ModulesComponent>;
  let component: ModulesComponent;
  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
