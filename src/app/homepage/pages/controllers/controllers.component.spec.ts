import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ControllersComponent } from './controllers.component';
import { TabsComponent } from '../../../shared/components/tabs/tabs.component';
import { ExtensionPipe } from '../../../shared/pipes/extension.pipe';

describe('ControllersComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [
        TabsComponent,
        ExtensionPipe,
        ControllersComponent
      ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<ControllersComponent>;
  let component: ControllersComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(ControllersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
