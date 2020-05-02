import { NgModule, Injector, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CodeComponent } from './code/code.component';
import { createCustomElement } from '@angular/elements';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [CodeComponent],
  imports: [CommonModule],
  entryComponents: [CodeComponent],
  exports: [CodeComponent],
})
export class CustomElementsModule {
  constructor(injector: Injector) {
    const CodeElement = createCustomElement(CodeComponent, { injector });
    customElements.define('code-element', CodeElement);
  }
}
