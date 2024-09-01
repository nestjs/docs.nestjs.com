import { Component, ElementRef, inject } from '@angular/core';
import { BehaviorSubject, take, timer } from 'rxjs';

@Component({
  selector: 'app-copy-button',
  templateUrl: './copy-button.component.html',
  styleUrls: ['./copy-button.component.scss']
})
export class CopyButtonComponent {
  public elRef = inject<ElementRef<HTMLElement>>(ElementRef<HTMLElement>);
  public buttonText = new BehaviorSubject<string>('Copy');


  onCopy() {
    this.buttonText.next('Copied!');
    timer(2000).pipe(take(1)).subscribe(() => {
      console.log('OI');
      this.buttonText.next('Copy');
    });
  }
}
