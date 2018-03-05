import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomDecoratorsComponent } from './custom-decorators.component';
import { TabsComponent } from '../../../shared/components/tabs/tabs.component';
import { ExtensionPipe } from '../../../shared/pipes/extension.pipe';

describe('CustomDecoratorsComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [
        TabsComponent,
        ExtensionPipe,
        CustomDecoratorsComponent
      ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<CustomDecoratorsComponent>;
  let component: CustomDecoratorsComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(CustomDecoratorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
