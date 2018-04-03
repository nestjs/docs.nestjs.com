import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExecutionContextComponent } from './execution-context.component';
import { TabsComponent } from '../../../shared/components/tabs/tabs.component';
import { ExtensionPipe } from '../../../shared/pipes/extension.pipe';

describe('ExecutionContextComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [
        TabsComponent,
        ExtensionPipe,
        ExecutionContextComponent
      ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<ExecutionContextComponent>;
  let component: ExecutionContextComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(ExecutionContextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
