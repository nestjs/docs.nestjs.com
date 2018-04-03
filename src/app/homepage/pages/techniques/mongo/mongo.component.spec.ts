import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MongoComponent } from './mongo.component';
import { TabsComponent } from '../../../../shared/components/tabs/tabs.component';
import { ExtensionPipe } from '../../../../shared/pipes/extension.pipe';

describe('MongoComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [
        TabsComponent,
        ExtensionPipe,
        MongoComponent
      ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<MongoComponent>;
  let component: MongoComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(MongoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
