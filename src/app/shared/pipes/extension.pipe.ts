import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'extension',
    standalone: true
})
export class ExtensionPipe implements PipeTransform {
  transform(value: any, args?: any): any {
    // Filenames that already carry an extension (e.g. `orders.json`) are shown as-is.
    if (/\.(json|ya?ml|sql|graphql|gql|lua|env|sh|html|css|md|prisma)$/i.test(value)) {
      return value;
    }
    return !args ? `${value}.ts` : `${value}.js`;
  }
}
