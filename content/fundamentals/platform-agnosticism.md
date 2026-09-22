### Platform agnosticism

Nest is a platform-agnostic framework. You can develop **reusable logical parts** and use them across different types of applications. For example, most components can be reused without change across different underlying HTTP server frameworks (e.g., Express and Fastify), and even across different _types_ of applications (e.g., HTTP servers, microservices with different transport layers, and WebSockets).

#### Build once, use everywhere

The **Overview** section of the documentation primarily shows coding techniques using HTTP server frameworks (e.g., apps providing a REST API or an MVC-style server-side rendered app). However, all those building blocks can be used on top of different transport layers ([microservices](/microservices/basics) or [WebSockets](/websockets/gateways)).

Nest also comes with a dedicated [GraphQL](/graphql/quick-start) module. You can use GraphQL as your API layer interchangeably with a REST API.

In addition, the [application context](/application-context) feature lets you build any kind of Node.js application on top of Nest, including cron jobs and CLI apps.

Nest aims to be a full-fledged platform for Node.js apps that brings a higher level of modularity and reusability to your applications. Build once, use everywhere.
