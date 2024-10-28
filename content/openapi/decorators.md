### Decorators

All of the available OpenAPI decorators have an `Api` prefix to distinguish them from the core decorators. Below is a full list of the exported decorators along with a designation of the level at which the decorator may be applied.

|                           |                     |
| ------------------------- | ------------------- |
| `@ApiBasicAuth()`         | Method / Controller |
| `@ApiBearerAuth()`        | Method / Controller |
| `@ApiBody()`              | Method              |
| `@ApiConsumes()`          | Method / Controller |
| `@ApiCookieAuth()`        | Method / Controller |
| `@ApiExcludeController()` | Controller          |
| `@ApiExcludeEndpoint()`   | Method              |
| `@ApiExtension()`         | Method              |
| `@ApiExtraModels()`       | Method / Controller |
| `@ApiHeader()`            | Method / Controller |
| `@ApiHideProperty()`      | Model               |
| `@ApiOAuth2()`            | Method / Controller |
| `@ApiOperation()`         | Method              |
| `@ApiParam()`             | Method / Controller |
| `@ApiProduces()`          | Method / Controller |
| `@ApiSchema()`            | Model               |
| `@ApiProperty()`          | Model               |
| `@ApiPropertyOptional()`  | Model               |
| `@ApiQuery()`             | Method / Controller |
| `@ApiResponse()`          | Method / Controller |
| `@ApiSecurity()`          | Method / Controller |
| `@ApiTags()`              | Method / Controller |
| `@ApiCallbacks()`         | Method / Controller |
