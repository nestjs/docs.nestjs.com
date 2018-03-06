import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MvcComponent } from './mvc.component';
import { TabsComponent } from '../../../../shared/components/tabs/tabs.component';
import { ExtensionPipe } from '../../../../shared/pipes/extension.pipe';

describe('MvcComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [
        TabsComponent,
        ExtensionPipe,
        MvcComponent
      ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<MvcComponent>;
  let component: MvcComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(MvcComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
