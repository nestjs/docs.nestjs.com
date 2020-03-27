### Mapped types

##### This chapter applies only to code first approach

A common task is to take an existing type and make each of its properties optional. This happens often enough that NestJS provides a way to create new types based on old types — mapped types.

#### Partial

Make all properties of a type optional.

Original type:

```typescript
@InputType()
class CreateUserInput {
  @Field()
  email: string;

  @Field()
  password: string;

  @Field()
  firstName: string;
}
```

Mapped type:

```typescript
@InputType()
export class UpdateUserInput extends PartialType(CreateUserInput) {}
```

> info **Hint** The `PartialType()` function is imported from the `@nestjs/graphql` package.

> warning **Warning** If you want to create an `InputType` based on the `ObjectType`, you must explicitly specify it in the function, as follows: `PartialType(CreateUserInput, InputType)` where `InputType` is a reference to a decorator factory.

#### Pick

Constructs a type by picking the set of properties from type.

Original type:

```typescript
@InputType()
class CreateUserInput {
  @Field()
  email: string;

  @Field()
  password: string;

  @Field()
  firstName: string;
}
```

Mapped type:

```typescript
@InputType()
export class UpdateEmailInput extends PickType(CreateUserInput, ['email']) {}
```

> info **Hint** The `PickType()` function is imported from the `@nestjs/graphql` package.

#### Pick

Constructs a type by picking all properties from type and then removing particular set of keys.

Original type:

```typescript
@InputType()
class CreateUserInput {
  @Field()
  email: string;

  @Field()
  password: string;

  @Field()
  firstName: string;
}
```

Mapped type:

```typescript
@InputType()
export class UpdateUserInput extends OmitType(CreateUserInput, ['email']) {}
```

> info **Hint** The `PickType()` function is imported from the `@nestjs/graphql` package.

#### Composition

Mapped types are composeable.

Example:

```typescript
@InputType()
export class UpdateUserInput extends Partial(
  OmitType(CreateUserInput, ['email']),
) {}
```
