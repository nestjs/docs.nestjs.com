import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  OnInit,
  ViewChild,
  HostBinding,
  inject,
} from '@angular/core';
import { CommonModule, NgTemplateOutlet } from '@angular/common';

export interface Option {
  title: string;
  value?: any;
}

@Component({
  selector: 'app-api-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
  standalone: true,
  imports: [CommonModule, NgTemplateOutlet]
})
export class SelectComponent implements OnInit {
  @HostBinding('class') classes = 'select-box';

  public static instancesCounter = 0;

  @Input() selected: Option | undefined;
  @Input() options: Option[];
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() change = new EventEmitter<{ option: Option; index: number }>();
  @Output() optionsToggled = new EventEmitter<boolean>();
  @Input() showSymbol = false;
  @Input() label = '';
  @Input() disabled: boolean;
  @ViewChild('listBox', { read: ElementRef }) listBox: ElementRef;

  private _showOptions = false;
  public listBoxId = `app-select-list-box-${SelectComponent.instancesCounter++}`;

  public currentOptionIdx = 0;

  private readonly hostElement = inject(ElementRef);

  public ngOnInit(): void {
    this.label = this.label || '';
  }

  public get showOptions() {
    return this._showOptions;
  }

  public set showOptions(showOptions: boolean) {
    if (!this.disabled) {
      if (this.showOptions !== showOptions) {
        this.optionsToggled.emit(showOptions);
      }
      this._showOptions = showOptions;
    }
  }

  public toggleOptions(): void {
    this.showOptions = !this.showOptions;
  }

  public hideOptions(): void {
    this.showOptions = false;
  }

  public select(index: number): void {
    const option = this.options[index];
    this.selected = option;
    this.change.emit({ option, index });
    this.hideOptions();
  }

  @HostListener('document:click', ['$event.target'])
  public onClick(eventTarget: HTMLElement): void {
    // Hide the options if we clicked outside the component
    if (!this.hostElement.nativeElement.contains(eventTarget)) {
      this.hideOptions();
    }
  }

  public handleKeydown(event: KeyboardEvent): void {
    const runOrOpenOptions = (fn: () => void): void => {
      if (!this.showOptions) {
        this.showOptions = true;
        const indexOfSelected =
          !this.options || !this.selected
            ? -1
            : this.options.indexOf(this.selected);
        this.currentOptionIdx = indexOfSelected > 0 ? indexOfSelected : 0;
      } else {
        fn();
      }
    };
    switch (event.key) {
      case 'ArrowDown':
        runOrOpenOptions(
          () =>
            (this.currentOptionIdx = Math.min(
              this.currentOptionIdx + 1,
              (this.options?.length ?? 0) - 1
            ))
        );
        break;
      case 'ArrowUp':
        runOrOpenOptions(
          () => (this.currentOptionIdx = Math.max(this.currentOptionIdx - 1, 0))
        );
        break;
      case 'Escape':
        this.hideOptions();
        break;
      case 'Tab':
        if (this.showOptions) {
          this.select(this.currentOptionIdx);
        }
        break;
      case 'Enter':
      case 'Space':
      case ' ':
        runOrOpenOptions(() => this.select(this.currentOptionIdx));
        break;
    }
    if (event.key !== 'Tab') {
      event.preventDefault();
    }
  }
}
