import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MicroservicesExceptionFiltersComponent } from './exception-filters.component';
import { TabsComponent } from '../../../../shared/components/tabs/tabs.component';
import { ExtensionPipe } from '../../../../shared/pipes/extension.pipe';

describe('MicroservicesExceptionFiltersComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [
        TabsComponent,
        ExtensionPipe,
        MicroservicesExceptionFiltersComponent
      ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<MicroservicesExceptionFiltersComponent>;
  let component: MicroservicesExceptionFiltersComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(MicroservicesExceptionFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
