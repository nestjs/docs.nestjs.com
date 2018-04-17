import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-scalars',
  templateUrl: './scalars.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScalarsComponent extends BasePageComponent {
  get jsonScalar() {
    return `
const resolvers = { JSON: GraphQLJSON };
const schema = this.graphQLFactory.createSchema({ typeDefs, resolvers });`;
  }

  get typeDefJson() {
    return `
scalar JSON

type Foo {
  field: JSON
}`;
  }
}
