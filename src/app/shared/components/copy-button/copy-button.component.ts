import { Component, ElementRef, inject } from '@angular/core';
import { BehaviorSubject, take, timer } from 'rxjs';

@Component({
  selector: 'app-copy-button',
  templateUrl: './copy-button.component.html',
  styleUrls: ['./copy-button.component.scss']
})
export class CopyButtonComponent {
  public elRef = inject<ElementRef<HTMLElement>>(ElementRef<HTMLElement>);
  public buttonIcon = new BehaviorSubject<string>('content_copy');


  onCopy() {
    this.buttonIcon.next('check');
    timer(2000).pipe(take(1)).subscribe(() => {
      this.buttonIcon.next('content_copy');
    });
  }
}
