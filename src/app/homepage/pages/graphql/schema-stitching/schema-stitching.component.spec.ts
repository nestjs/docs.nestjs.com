import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SchemaStitchingComponent } from './schema-stitching.component';
import { TabsComponent } from '../../../../shared/components/tabs/tabs.component';
import { ExtensionPipe } from '../../../../shared/pipes/extension.pipe';

describe('SchemaStitchingComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [
        TabsComponent,
        ExtensionPipe,
        SchemaStitchingComponent
      ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<SchemaStitchingComponent>;
  let component: SchemaStitchingComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(SchemaStitchingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
