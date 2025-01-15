import {
  Component,
  ElementRef,
  inject,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';

@Component({
  selector: 'app-copy-button',
  templateUrl: './copy-button.component.html',
  styleUrls: ['./copy-button.component.scss'],
})
export class CopyButtonComponent implements OnDestroy {
  public elRef = inject<ElementRef<HTMLElement>>(ElementRef<HTMLElement>);
  public copied = false;
  public cdr = inject<ChangeDetectorRef>(ChangeDetectorRef);
  private revertIconTimeout: ReturnType<typeof setTimeout | null> = null;

  onCopy() {
    const preRef = this.elRef.nativeElement.querySelector('pre:not(.hide)');
    if (!preRef) {
      return;
    }
    navigator.clipboard.writeText(preRef.firstChild.textContent);
    this.copied = true;
    this.cdr.detectChanges();

    this.revertIconTimeout = setTimeout(() => {
      this.copied = false;
      this.cdr.detectChanges();
      this.revertIconTimeout = null;
    }, 2000);
  }
  
  ngOnDestroy(): void {
    if (this.revertIconTimeout) {
      clearTimeout(this.revertIconTimeout);
    }
  }
}
