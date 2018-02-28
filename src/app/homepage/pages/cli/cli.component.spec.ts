import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {CliComponent} from './cli.component';


describe('CliComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [
        CliComponent
      ]
    }).compileComponents();
  }));

  let fixture: ComponentFixture<CliComponent>;
  let component: CliComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(CliComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    return expect(component).toBeTruthy();
  });
});
