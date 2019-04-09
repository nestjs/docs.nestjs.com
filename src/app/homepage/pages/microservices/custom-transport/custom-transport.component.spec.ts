import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomTransportComponent } from './custom-transport.component';
import { TabsComponent } from '../../../../shared/components/tabs/tabs.component';
import { ExtensionPipe } from '../../../../shared/pipes/extension.pipe';

describe('CustomTransportComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [
        TabsComponent,
        ExtensionPipe,
        CustomTransportComponent
      ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<CustomTransportComponent>;
  let component: CustomTransportComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(CustomTransportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
