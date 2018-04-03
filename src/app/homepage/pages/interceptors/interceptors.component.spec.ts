import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InterceptorsComponent } from './interceptors.component';
import { TabsComponent } from '../../../shared/components/tabs/tabs.component';
import { ExtensionPipe } from '../../../shared/pipes/extension.pipe';

describe('InterceptorsComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [
        TabsComponent,
        ExtensionPipe,
        InterceptorsComponent
      ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<InterceptorsComponent>;
  let component: InterceptorsComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(InterceptorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
