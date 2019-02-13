### Global Prefix

In order to set a prefix for each route registered in the application at once, you can use the `setGlobalPrefix()` method of the `INestApplication` instance.

```typescript
const app = await NestFactory.create(ApplicationModule);
app.setGlobalPrefix('v1');
```
