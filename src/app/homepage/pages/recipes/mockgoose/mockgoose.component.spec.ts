import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MockgooseComponent } from './mockgoose.component';
import { TabsComponent } from '../../../../shared/components/tabs/tabs.component';
import { ExtensionPipe } from '../../../../shared/pipes/extension.pipe';

describe('MockgooseComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [
        TabsComponent,
        ExtensionPipe,
        MockgooseComponent
      ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<MockgooseComponent>;
  let component: MockgooseComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(MockgooseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
