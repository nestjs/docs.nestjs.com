import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'extension'
})
export class ExtensionPipe implements PipeTransform {
  transform(value: any, args?: any): any {
    return !args ? `${value}.ts` : `${value}.js`;
  }
}
