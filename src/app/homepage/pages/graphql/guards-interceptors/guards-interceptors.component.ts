import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-guards-interceptors',
  templateUrl: './guards-interceptors.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuardsInterceptorsComponent extends BasePageComponent {
  get useGuardsExample() {
    return `
@Query('author')
@UseGuards(AuthGuard)
async getAuthor(@Args('id', ParseIntPipe) id: number) {
  return await this.authorsService.findOneById(id);
}`;
  }

  get useInterceptorsExample() {
    return `
@Mutation()
@UseInterceptors(EventsInterceptor)
async upvotePost(@Args('postId') postId: number) {
  return await this.postsService.upvoteById({ id: postId });
}`;
  }

  get gqlExecutionContext() {
    return `
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const ctx = GqlExecutionContext.create(context);
    return true;
  }
}`;
  }

  get customDecorators() {
    return `
export const User = createParamDecorator(
  (data, [root, args, ctx, info]) => ctx.user,
);`;
  }
}
