import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ResolversMapComponent } from './resolvers-map.component';
import { TabsComponent } from '../../../../shared/components/tabs/tabs.component';
import { ExtensionPipe } from '../../../../shared/pipes/extension.pipe';

describe('ResolversMapComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [
        TabsComponent,
        ExtensionPipe,
        ResolversMapComponent
      ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<ResolversMapComponent>;
  let component: ResolversMapComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(ResolversMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
