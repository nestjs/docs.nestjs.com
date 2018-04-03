import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RedisComponent } from './redis.component';
import { TabsComponent } from '../../../../shared/components/tabs/tabs.component';
import { ExtensionPipe } from '../../../../shared/pipes/extension.pipe';

describe('RedisComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [
        TabsComponent,
        ExtensionPipe,
        RedisComponent
      ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<RedisComponent>;
  let component: RedisComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(RedisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
