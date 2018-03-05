import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GuardsInterceptorsComponent } from './guards-interceptors.component';
import { TabsComponent } from '../../../../shared/components/tabs/tabs.component';
import { ExtensionPipe } from '../../../../shared/pipes/extension.pipe';

describe('GuardsInterceptorsComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [
        TabsComponent,
        ExtensionPipe,
        GuardsInterceptorsComponent
      ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<GuardsInterceptorsComponent>;
  let component: GuardsInterceptorsComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(GuardsInterceptorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
