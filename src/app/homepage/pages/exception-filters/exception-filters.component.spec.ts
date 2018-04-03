import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExceptionFiltersComponent } from './exception-filters.component';
import { TabsComponent } from '../../../shared/components/tabs/tabs.component';
import { ExtensionPipe } from '../../../shared/pipes/extension.pipe';

describe('ExceptionFiltersComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [
        TabsComponent,
        ExtensionPipe,
        ExceptionFiltersComponent
      ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<ExceptionFiltersComponent>;
  let component: ExceptionFiltersComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(ExceptionFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
