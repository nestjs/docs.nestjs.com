import { Component, ChangeDetectionStrategy } from '@angular/core';
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
async getAuthor(obj, args, context, info) {
  const { id } = args;
  return await this.authorsService.findOneById(id);
}`;
  }

  get useInterceptorsExample() {
    return `
@Mutation()
@UseInterceptors(EventsInterceptor)
async upvotePost(_, { postId }) {
  return await this.postsService.upvoteById({ id: postId });
}`;
  }
}
