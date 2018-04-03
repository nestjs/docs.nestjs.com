import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CqrsComponent } from './cqrs.component';
import { TabsComponent } from '../../../../shared/components/tabs/tabs.component';
import { ExtensionPipe } from '../../../../shared/pipes/extension.pipe';

describe('CqrsComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [
        TabsComponent,
        ExtensionPipe,
        CqrsComponent
      ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<CqrsComponent>;
  let component: CqrsComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(CqrsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
