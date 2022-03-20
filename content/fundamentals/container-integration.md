### Container integration

#### Dockerfile template

Here is a `Dockerfile` template that can be used as a template:

```dockerfile
# References:
#  https://nodejs.org/en/docs/guides/nodejs-docker-webapp/
#  https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md
#  https://adambrodziak.pl/dockerfile-good-practices-for-node-and-npm


FROM node:16.13-alpine3.12 AS builder

WORKDIR /usr/src/app

# Set build environment
ENV NODE_ENV build

# If/When installing global npm modules, put them outside of root user
ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH=$PATH:/home/node/.npm-global/bin

# Install dependencies and run compilation
COPY package*.json ./
# RUN npm ci --only=production
RUN npm ci

# Copy all the other files
COPY . .

# Build and run unit tests
RUN npm run build \
    && npm run test \
    && npm run test:e2e

# Remove non prod modules
RUN npm prune --production

#######################

FROM node:16.13-alpine3.12 AS runtime

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/package*.json /usr/src/app/
COPY --from=builder /usr/src/app/node_modules/ /usr/src/app/node_modules/
COPY --from=builder /usr/src/app/dist/ /usr/src/app/dist/

# Set production environment by default but it can be overridden
ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

# Run in non-root user (node user is created by base image)
# RUN chown node:node ./  # if your app need write access to the app folder
USER node

# Export port
EXPOSE 3000

# This will be executed inside Tini (https://github.com/krallin/tini), already present inside node image
CMD ["node", "dist/src/main"]
```


#### How to gracefully exit (handling SIGTERM and SIGINT)

To correctly close your app you should handle SIGTERM and SIGINT signals.

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  process.on('SIGINT', () => {
    console.log("Request to exit ...");
    process.kill(process.pid, 'SIGTERM');
  });
  process.on('SIGTERM', () => {
    console.log("Terminating ...");
    app.close()
      .catch((err) => console.error("Error when closing application", err))
      .then(() => console.log('Process terminated') );
  });
  
  await app.listen(3000);
}
bootstrap();
```
