import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DependencyInjectionComponent } from './dependency-injection.component';
import { TabsComponent } from '../../../../shared/components/tabs/tabs.component';
import { ExtensionPipe } from '../../../../shared/pipes/extension.pipe';

describe('DependencyInjectionComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [
        TabsComponent,
        ExtensionPipe,
        DependencyInjectionComponent
      ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<DependencyInjectionComponent>;
  let component: DependencyInjectionComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(DependencyInjectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
