import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-scalars',
  templateUrl: './scalars.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScalarsComponent extends BasePageComponent {
  get jsonScalar() {
    return `
import * as GraphQLJSON from 'graphql-type-json';

@Module({
  imports: [
    GraphQLModule.forRoot({
      typePaths: ['./**/*.graphql'],
      resolvers: { JSON: GraphQLJSON },
    }),
  ],
})
export class ApplicationModule {}`;
  }

  get typeDefJson() {
    return `
scalar JSON

type Foo {
  field: JSON
}`;
  }

  get classScalar() {
    return `
import { Scalar } from '@nestjs/graphql';
import { Kind } from 'graphql';

@Scalar('Date')
export class DateScalar {
  description = 'Date custom scalar type';

  parseValue(value) {
    return new Date(value); // value from the client
  }

  serialize(value) {
    return value.getTime(); // value sent to the client
  }

  parseLiteral(ast) {
    if (ast.kind === Kind.INT) {
      return parseInt(ast.value, 10); // ast value is always in string format
    }
    return null;
  }
}`;
  }

  get registerDateScalar() {
    return `
@Module({
  providers: [DateScalar],
})
export class CommonModule {}`;
  }
}
