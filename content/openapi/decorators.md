### Decorators

All OpenAPI decorators have an `Api` prefix to distinguish them from the core decorators. The table below lists the exported decorators, along with the level at which each one can be applied.

|                           |                     |
| ------------------------- | ------------------- |
| `@ApiBasicAuth()`         | Method / Controller |
| `@ApiBearerAuth()`        | Method / Controller |
| `@ApiBody()`              | Method              |
| `@ApiConsumes()`          | Method / Controller |
| `@ApiCookieAuth()`        | Method / Controller |
| `@ApiExcludeController()` | Controller          |
| `@ApiExcludeEndpoint()`   | Method              |
| `@ApiDefaultGetter()`     | Method              |
| `@ApiExtension()`         | Method / Controller |
| `@ApiExtraModels()`       | Method / Controller / Model |
| `@ApiHeader()`            | Method / Controller |
| `@ApiHeaders()`           | Method / Controller |
| `@ApiHideProperty()`      | Model               |
| `@ApiIncludeEndpoint()`   | Method              |
| `@ApiLink()`              | Method              |
| `@ApiOAuth2()`            | Method / Controller |
| `@ApiOperation()`         | Method              |
| `@ApiParam()`             | Method / Controller |
| `@ApiProduces()`          | Method / Controller |
| `@ApiSchema()`            | Model               |
| `@ApiProperty()`          | Model               |
| `@ApiPropertyOptional()`  | Model               |
| `@ApiQuery()`             | Method / Controller |
| `@ApiResponse()`          | Method / Controller |
| `@ApiResponseProperty()`  | Model               |
| `@ApiSecurity()`          | Method / Controller |
| `@ApiTags()`              | Method / Controller |
| `@ApiCallbacks()`         | Method / Controller |
| `@ApiWebhook()`           | Method              |

The shorthand response decorators (e.g., `@ApiOkResponse()` and `@ApiNotFoundResponse()`, listed in the [operations](/openapi/operations#responses) chapter) can be applied at the same levels as `@ApiResponse()`.
