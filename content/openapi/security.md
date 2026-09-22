### Security

To define which security mechanisms a specific operation uses, apply the `@ApiSecurity()` decorator:

```typescript
@ApiSecurity('basic')
@Controller('cats')
export class CatsController {}
```

Before you run your application, add the security definition to your base document using `DocumentBuilder`:

```typescript
const options = new DocumentBuilder().addSecurity('basic', {
  type: 'http',
  scheme: 'basic',
});
```

The most popular authentication techniques (e.g., `basic` and `bearer`) are built in, so you don't have to define their security mechanisms manually as shown above.

#### Basic authentication

To enable basic authentication, use `@ApiBasicAuth()`:

```typescript
@ApiBasicAuth()
@Controller('cats')
export class CatsController {}
```

Before you run your application, add the security definition to your base document using `DocumentBuilder`:

```typescript
const options = new DocumentBuilder().addBasicAuth();
```

#### Bearer authentication

To enable bearer authentication, use `@ApiBearerAuth()`:

```typescript
@ApiBearerAuth()
@Controller('cats')
export class CatsController {}
```

Before you run your application, add the security definition to your base document using `DocumentBuilder`:

```typescript
const options = new DocumentBuilder().addBearerAuth();
```

#### OAuth2 authentication

To enable OAuth2, use `@ApiOAuth2()`:

```typescript
@ApiOAuth2(['pets:write'])
@Controller('cats')
export class CatsController {}
```

Before you run your application, add the security definition to your base document using `DocumentBuilder`:

```typescript
const options = new DocumentBuilder().addOAuth2();
```

#### Cookie authentication

To enable cookie authentication, use `@ApiCookieAuth()`:

```typescript
@ApiCookieAuth()
@Controller('cats')
export class CatsController {}
```

Before you run your application, add the security definition to your base document using `DocumentBuilder`:

```typescript
const options = new DocumentBuilder().addCookieAuth('optional-session-id');
```
