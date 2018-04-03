import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BasicsComponent } from './basics.component';
import { TabsComponent } from '../../../../shared/components/tabs/tabs.component';
import { ExtensionPipe } from '../../../../shared/pipes/extension.pipe';

describe('BasicsComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [
        TabsComponent,
        ExtensionPipe,
        BasicsComponent
      ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<BasicsComponent>;
  let component: BasicsComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(BasicsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
