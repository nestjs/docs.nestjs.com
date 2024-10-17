import { Component, ElementRef, inject } from '@angular/core';

@Component({
  selector: 'app-copy-button',
  templateUrl: './copy-button.component.html',
  styleUrls: ['./copy-button.component.scss'],
})
export class CopyButtonComponent {
  public elRef = inject<ElementRef<HTMLElement>>(ElementRef<HTMLElement>);
  public copied = false;

  onCopy() {
    const preRef = this.elRef.nativeElement.querySelector('pre:not(.hide)');
    if (!preRef) {
      return;
    }
    navigator.clipboard.writeText(preRef.firstChild.textContent);
    this.copied = true;
  }
}
