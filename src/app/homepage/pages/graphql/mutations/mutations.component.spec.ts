import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MutationsComponent } from './mutations.component';
import { TabsComponent } from '../../../../shared/components/tabs/tabs.component';
import { ExtensionPipe } from '../../../../shared/pipes/extension.pipe';

describe('MutationsComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [
        TabsComponent,
        ExtensionPipe,
        MutationsComponent]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<MutationsComponent>;
  let component: MutationsComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(MutationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
