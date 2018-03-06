import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MongodbComponent } from './mongodb.component';
import { TabsComponent } from '../../../../shared/components/tabs/tabs.component';
import { ExtensionPipe } from '../../../../shared/pipes/extension.pipe';

describe('MongodbComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [
        TabsComponent,
        ExtensionPipe,
        MongodbComponent
      ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<MongodbComponent>;
  let component: MongodbComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(MongodbComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
