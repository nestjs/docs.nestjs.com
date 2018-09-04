import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-serialization',
  templateUrl: './serialization.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SerializationComponent extends BasePageComponent {
  get userEntity() {
    return `
import { Exclude } from 'class-transformer';

export class UserEntity {
  id: number;
  firstName: string;
  lastName: string;

  @Exclude()
  password: string;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}`;
  }

  get returnUserEntity() {
    return `
@UseInterceptors(ClassSerializerInterceptor)
@Get()
findOne(): UserEntity {
  return new UserEntity({
    id: 1,
    firstName: 'Kamil',
    lastName: 'Mysliwiec',
    password: 'password',
  });
}`;
  }

  get response() {
    return `
{
  "id": 1,
  "firstName": "Kamil",
  "lastName": "Mysliwiec"
}`;
  }

  get expose() {
    return `
@Expose()
get fullName(): string {
  return \`\${this.firstName} \${this.lastName}\`;
}`;
  }

  get transform() {
    return `
@Transform(role => role.name)
role: RoleEntity;`;
  }

  get serializeOptions() {
    return `
@SerializeOptions({
  excludePrefixes: ['_'],
})
@Get()
findOne(): UserEntity {
  return {};
}`;
  }
}
