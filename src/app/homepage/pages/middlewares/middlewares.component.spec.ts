import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MiddlewaresComponent } from './middlewares.component';
import { TabsComponent } from '../../../shared/components/tabs/tabs.component';
import { ExtensionPipe } from '../../../shared/pipes/extension.pipe';

describe('MiddlewaresComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [
        TabsComponent,
        ExtensionPipe,
        MiddlewaresComponent
      ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<MiddlewaresComponent>;
  let component: MiddlewaresComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(MiddlewaresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
