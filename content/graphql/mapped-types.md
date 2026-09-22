### Mapped types

> warning **Warning** This chapter applies only to the code first approach.

As you build out features like CRUD (Create/Read/Update/Delete), it's often useful to construct variants of a base entity type. Nest provides several utility functions that perform type transformations to make this task more convenient.

#### Partial

When building input validation types (also called Data Transfer Objects or DTOs), it's often useful to build **create** and **update** variations on the same type. For example, the **create** variant may require all fields, while the **update** variant may make all fields optional.

Nest provides the `PartialType()` utility function to make this task easier and minimize boilerplate.

The `PartialType()` function returns a type (class) with all the properties of the input type set to optional. For example, suppose we have a **create** type as follows:

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

By default, all of these fields are required. To create a type with the same fields, but with each one optional, use `PartialType()` passing the class reference (`CreateUserInput`) as an argument:

```typescript
@InputType()
export class UpdateUserInput extends PartialType(CreateUserInput) {}
```

> info **Hint** The `PartialType()` function is imported from the `@nestjs/graphql` package.

The `PartialType()` function takes an optional second argument: a reference to a decorator factory. Use it to change the decorator applied to the resulting (child) class. If you don't specify it, the child class effectively uses the same decorator as the **parent** class (the class referenced in the first argument). In the example above, we extend `CreateUserInput`, which is annotated with the `@InputType()` decorator. Since we want `UpdateUserInput` to be treated as if it were also decorated with `@InputType()`, we didn't need to pass `InputType` as the second argument. If the parent and child types differ (e.g., the parent is decorated with `@ObjectType()`), pass `InputType` as the second argument:

```typescript
@InputType()
export class UpdateUserInput extends PartialType(User, InputType) {}
```

Instead of a decorator factory, you can pass an options object as the second argument. It accepts the `decorator` property, `omitDefaultValues` (set to `true` to drop the default values inherited from the parent fields), and `skipNullProperties` (defaults to `true`; set it to `false` to skip validation only for `undefined` values, and still validate `null`).

#### Pick

The `PickType()` function constructs a new type (class) by picking a set of properties from an input type. For example, suppose we start with a type like:

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

You can pick a set of properties from this class using the `PickType()` utility function:

```typescript
@InputType()
export class UpdateEmailInput extends PickType(CreateUserInput, [
  'email',
] as const) {}
```

> info **Hint** The `PickType()` function is imported from the `@nestjs/graphql` package.

#### Omit

The `OmitType()` function constructs a type by picking all properties from an input type and then removing a particular set of keys. For example, suppose we start with a type like:

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

You can generate a derived type that has every property **except** `email`, as shown below. Here, the second argument to `OmitType()` is an array of property names.

```typescript
@InputType()
export class UpdateUserInput extends OmitType(CreateUserInput, [
  'email',
] as const) {}
```

> info **Hint** The `OmitType()` function is imported from the `@nestjs/graphql` package.

#### Intersection

The `IntersectionType()` function combines two types into one new type (class). For example, suppose we start with two types like:

```typescript
@InputType()
class CreateUserInput {
  @Field()
  email: string;

  @Field()
  password: string;
}

@ObjectType()
export class AdditionalUserInfo {
  @Field()
  firstName: string;

  @Field()
  lastName: string;
}
```

You can generate a new type that combines all the properties of both types:

```typescript
@InputType()
export class UpdateUserInput extends IntersectionType(
  CreateUserInput,
  AdditionalUserInfo,
) {}
```

> info **Hint** The `IntersectionType()` function is imported from the `@nestjs/graphql` package.

#### Composition

The type mapping utility functions are composable. For example, the following produces a type (class) that has all the properties of the `CreateUserInput` type except `email`, with each of them set to optional:

```typescript
@InputType()
export class UpdateUserInput extends PartialType(
  OmitType(CreateUserInput, ['email'] as const),
) {}
```
