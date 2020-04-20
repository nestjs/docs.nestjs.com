import {
  Component,
  Input,
  ViewEncapsulation,
  AfterViewInit,
  ElementRef,
} from '@angular/core';

@Component({
  selector: 'app-code',
  templateUrl: './code.component.html',
  styleUrls: ['./code.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class CodeComponent implements AfterViewInit {
  constructor(public element: ElementRef) {}

  public isJsActive = false;
  public hasSwitcher: boolean;

  @Input() public filename: string;

  ngAfterViewInit() {
    this.hasSwitcher = this.element.nativeElement.children.length > 1;
  }
}
