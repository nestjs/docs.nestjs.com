import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WsExceptionFiltersComponent } from './exception-filters.component';
import { TabsComponent } from '../../../../shared/components/tabs/tabs.component';
import { ExtensionPipe } from '../../../../shared/pipes/extension.pipe';

describe('WsExceptionFiltersComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [
        TabsComponent,
        ExtensionPipe,
        WsExceptionFiltersComponent
      ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<WsExceptionFiltersComponent>;
  let component: WsExceptionFiltersComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(WsExceptionFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
