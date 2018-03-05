import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IdeComponent } from './ide.component';
import { TabsComponent } from '../../../../shared/components/tabs/tabs.component';
import { ExtensionPipe } from '../../../../shared/pipes/extension.pipe';

describe('IdeComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [
        TabsComponent,
        ExtensionPipe,
        IdeComponent
      ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<IdeComponent>;
  let component: IdeComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(IdeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
