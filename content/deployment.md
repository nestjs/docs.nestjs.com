### Deployment

When you're ready to deploy your NestJS application to production, there are key steps you can take to ensure it runs as efficiently as possible. In this guide, we'll explore essential tips and best practices to help you deploy your NestJS application successfully.

#### Prerequisites

Before deploying your NestJS application, ensure you have:

- A working NestJS application that is ready for deployment.
- Access to a deployment platform or server where you can host your application.
- All necessary environment variables set up for your application.
- Any required services, like a database, set up and ready to go.
- At least an LTS version of Node.js installed on your deployment platform.

> info **Hint** If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com/ 'Deploy Nest'), our official platform for deploying NestJS applications on AWS. With Mau, deploying your NestJS application is as simple as clicking a few buttons and running a single command:
>
> ```bash
> $ npm install -g @nestjs/mau
> $ mau deploy
> ```
>
> Once the deployment is complete, you'll have your NestJS application up and running on AWS in seconds!

#### Building your application

To build your NestJS application, you need to compile your TypeScript code into JavaScript. This process generates a `dist` directory containing the compiled files. You can build your application by running the following command:

```bash
$ npm run build
```

This command typically runs the `nest build` command under the hood, which is basically a wrapper around the TypeScript compiler with some additional features (assets copying, etc.). In case you have a custom build script, you can run it directly. Also, for NestJS CLI mono-repos, make sure to pass the name of the project to build as an argument (`npm run build my-app`).

Upon successful compilation, you should see a `dist` directory in your project root containing the compiled files, with the entry point being `main.js`. If you have any `.ts` files located in the root directory of your project (and your `tsconfig.json` configured to compile them), they will be copied to the `dist` directory as well, modifying the directory structure a bit (instead of `dist/main.js`, you will have `dist/src/main.js` so keep that in mind when configuring your server).

#### Production environment

Your production environment is where your application will be accessible to external users. This could be a cloud-based platform like [AWS](https://aws.amazon.com/) (with EC2, ECS, etc.), [Azure](https://azure.microsoft.com/), or [Google Cloud](https://cloud.google.com/), or even a dedicated server you manage, such as [Hetzner](https://www.hetzner.com/).

To simplify the deployment process and avoid manual setup, you can use a service like [Mau](https://mau.nestjs.com/ 'Deploy Nest'), our official platform for deploying NestJS applications on AWS. For more details, check out [this section](todo).

Some of the pros of using a **cloud-based platform** or service like [Mau](https://mau.nestjs.com/ 'Deploy Nest') include:

- Scalability: Easily scale your application as your user base grows.
- Security: Benefit from built-in security features and compliance certifications.
- Monitoring: Monitor your application's performance and health in real-time.
- Reliability: Ensure your application is always available with high uptime guarantees.

On the other hand, cloud-based platforms are typically more expensive than self-hosting, and you may have less control over the underlying infrastructure. Simple VPS can be a good choice if you're looking for a more cost-effective solution and have the technical expertise to manage the server yourself, but keep in mind that you'll need to handle tasks like server maintenance, security, and backups manually.

#### NODE_ENV=production

While there's technically no difference between development and production in Node.js and NestJS, it's a good practice to set the `NODE_ENV` environment variable to `production` when running your application in a production environment, as some libraries in the ecosystem may behave differently based on this variable (e.g., enabling or disabling debugging output, etc.).

You can set the `NODE_ENV` environment variable when starting your application like so:

```bash
$ NODE_ENV=production node dist/main.js
```

Or just set it in your cloud provider's/Mau dashboard.

#### Running your application

To run your NestJS application in production, just use the following command:

```bash
$ node dist/main.js # Adjust this based on your entry point location
```

This command starts your application, which will listen on the specified port (usually `3000` by default). Ensure that this matches the port you’ve configured in your application.

Alternatively, you can use the `nest start` command. This command is a wrapper around `node dist/main.js`, but it has one key difference: it automatically runs `nest build` before starting the application, so you don’t need to manually execute `npm run build`.

#### Health checks

Health checks are essential for monitoring the health and status of your NestJS application in production. By setting up a health check endpoint, you can regularly verify that your app is running as expected and respond to issues before they become critical.

In NestJS, you can easily implement health checks using the **@nestjs/terminus** package, which provides a powerful tool for adding health checks, including database connections, external services, and custom checks.

Check out [this guide](/recipes/terminus) to learn how to implement health checks in your NestJS application, and ensure your app is always monitored and responsive.

#### Logging

Logging is essential for any production-ready application. It helps track errors, monitor behavior, and troubleshoot issues. In NestJS, you can easily manage logging with the built-in logger or opt for external libraries if you need more advanced features.

Best practices for logging:

- Log Errors, Not Exceptions: Focus on logging detailed error messages to speed up debugging and issue resolution.
- Avoid Sensitive Data: Never log sensitive information like passwords or tokens to protect security.
- Use Correlation IDs: In distributed systems, include unique identifiers (like correlation IDs) in your logs to trace requests across different services.
- Use Log Levels: Categorize logs by severity (e.g., `info`, `warn`, `error`) and disable debug or verbose logs in production to reduce noise.

> info **Hint** If you're using [AWS](https://aws.amazon.com/) (with [Mau](https://mau.nestjs.com/ 'Deploy Nest') or directly), consider JSON logging to make it easier to parse and analyze your logs.

For distributed applications, using a centralized logging service like ElasticSearch, Loggly, or Datadog can be incredibly useful. These tools offer powerful features like log aggregation, search, and visualization, making it easier to monitor and analyze your application's performance and behavior.

#### Scaling up or out

Scaling your NestJS application effectively is crucial for handling increased traffic and ensuring optimal performance. There are two primary strategies for scaling: **vertical scaling** and **horizontal scaling**. Understanding these approaches will help you design your application to manage load efficiently.

**Vertical scaling**, often referred to as "scaling up" involves increasing the resources of a single server to enhance its performance. This could mean adding more CPU, RAM, or storage to your existing machine. Here are some key points to consider:

- Simplicity: Vertical scaling is generally simpler to implement since you only need to upgrade your existing server rather than manage multiple instances.
- Limitations: There are physical limits to how much you can scale a single machine. Once you reach the maximum capacity, you may need to consider other options.
- Cost-Effectiveness: For applications with moderate traffic, vertical scaling can be cost-effective, as it reduces the need for additional infrastructure.

Example: If your NestJS app is hosted on a virtual machine and you notice that it’s running slowly during peak hours, you can upgrade your VM to a larger instance with more resources. To upgrade your VM, just navigate to your current provider's dashboard and select a larger instance type.

**Horizontal scaling**, or "scaling out" involves adding more servers or instances to distribute the load. This strategy is widely used in cloud environments and is essential for applications expecting high traffic. Here are the benefits and considerations:

- Increased Capacity: By adding more instances of your application, you can handle a larger number of concurrent users without degrading performance.
- Redundancy: Horizontal scaling offers redundancy, as the failure of one server won't bring down your entire application. Traffic can be redistributed among the remaining servers.
- Load Balancing: To manage multiple instances effectively, use load balancers (like Nginx or AWS Elastic Load Balancing) to distribute incoming traffic evenly across your servers.

Example: For a NestJS application experiencing high traffic, you can deploy multiple instances of your app in a cloud environment and use a load balancer to route requests, ensuring that no single instance becomes a bottleneck.

This process is straightforward with containerization technologies like [Docker](https://www.docker.com/) and container orchestration platforms such as [Kubernetes](https://kubernetes.io/). Additionally, you can leverage cloud-specific load balancers like [AWS Elastic Load Balancing](https://aws.amazon.com/elasticloadbalancing/) or [Azure Load Balancer](https://azure.microsoft.com/en-us/services/load-balancer/) to distribute traffic across your application instances.

> info **Hint** [Mau](https://mau.nestjs.com/ 'Deploy Nest') offers built-in support for horizontal scaling on AWS, allowing you to easily deploy multiple instances of your NestJS application and manage them with just a few clicks.

#### Some other tips

There are a few more tips to keep in mind when deploying your NestJS application:

- **Security**: Ensure your application is secure and protected from common threats like SQL injection, XSS, etc. See the "Security" category for more details.
- **Monitoring**: Use monitoring tools like [Prometheus](https://prometheus.io/) or [New Relic](https://newrelic.com/) to track your application's performance and health. If you're using a cloud provider/Mau, they may offer built-in monitoring services (like [AWS CloudWatch](https://aws.amazon.com/cloudwatch/) etc.)
- **Do not hardcode environment variables**: Avoid hardcoding sensitive information like API keys, passwords, or tokens in your code. Use environment variables or a secrets manager to store and access these values securely.
- **Backups**: Regularly back up your data to prevent data loss in case of an incident.
- **Automate deployments**: Use CI/CD pipelines to automate your deployment process and ensure consistency across environments.
- **Rate limiting**: Implement rate limiting to prevent abuse and protect your application from DDoS attacks. Check out [Rate limiting chapter](/security/rate-limiting) for more details, or use a service like [AWS WAF](https://aws.amazon.com/waf/) for advanced protection.

#### Dockerizing your application

[Docker](https://www.docker.com/) is a platform that uses containerization to allow developers to package applications along with their dependencies into a standardized unit called a container. Containers are lightweight, portable, and isolated, making them ideal for deploying applications in various environments, from local development to production.

Benefits of Dockerizing your NestJS application:

- Consistency: Docker ensures that your application runs the same way on any machine, eliminating the "it works on my machine" problem.
- Isolation: Each container runs in its isolated environment, preventing conflicts between dependencies.
- Scalability: Docker makes it easy to scale your application by running multiple containers across different machines or cloud instances.
- Portability: Containers can be easily moved between environments, making it simple to deploy your application on different platforms.

To install Docker, follow the instructions on the [official website](https://www.docker.com/get-started). Once Docker is installed, you can create a `Dockerfile` in your NestJS project to define the steps for building your container image.

The `Dockerfile` is a text file that contains the instructions Docker uses to build your container image.

Here's a sample Dockerfile for a NestJS application:

```bash
# Use the official Node.js image as the base image
FROM node:20

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the application dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Build the NestJS application
RUN npm run build

# Expose the application port
EXPOSE 3000

# Command to run the application
CMD ["node", "dist/main"]
```

> info **Hint** Make sure to replace `node:20` with the appropriate Node.js version you're using in your project. You can find the available Node.js Docker images on the [official Docker Hub repository](https://hub.docker.com/_/node).

This is a basic Dockerfile that sets up a Node.js environment, installs the application dependencies, builds the NestJS application, and runs it. You can customize this file based on your project requirements (e.g., use different base images, optimize the build process, only install production dependencies, etc.).

Let's also create a `.dockerignore` file to specify which files and directories Docker should ignore when building the image. Create a `.dockerignore` file in your project root:

```bash
node_modules
dist
*.log
*.md
.git
```

This file ensures that unnecessary files are not included in the container image, keeping it lightweight. Now that you have your Dockerfile set up, you can build your Docker image. Open your terminal, navigate to your project directory, and run the following command:

```bash
docker build -t my-nestjs-app .
```

In this command:

- `-t my-nestjs-app`: Tags the image with the name `my-nestjs-app`.
- `.`: Indicates the current directory as the build context.

After building the image, you can run it as a container. Execute the following command:

```bash
docker run -p 3000:3000 my-nestjs-app
```

In this command:

- `-p 3000:3000`: Maps port 3000 on your host machine to port 3000 in the container.
- `my-nestjs-app`: Specifies the image to run.

Your NestJS application should now be running inside a Docker container.

If you want to deploy your Docker image to a cloud provider or share it with others, you'll need to push it to a Docker registry (like [Docker Hub](https://hub.docker.com/), [AWS ECR](https://aws.amazon.com/ecr/), or [Google Container Registry](https://cloud.google.com/container-registry)).

Once you decide on a registry, you can push your image by following these steps:

```bash
docker login # Log in to your Docker registry
docker tag my-nestjs-app your-dockerhub-username/my-nestjs-app # Tag your image
docker push your-dockerhub-username/my-nestjs-app # Push your image
```

Replace `your-dockerhub-username` with your Docker Hub username or the appropriate registry URL. After pushing your image, you can pull it on any machine and run it as a container.

Cloud providers like AWS, Azure, and Google Cloud offer managed container services that simplify deploying and managing containers at scale. These services provide features like auto-scaling, load balancing, and monitoring, making it easier to run your NestJS application in production.

#### Easy deployment with Mau

[Mau](https://mau.nestjs.com/ 'Deploy Nest') is our official platform for deploying NestJS applications on [AWS](https://aws.amazon.com/). If you're not ready to manage your infrastructure manually (or just want to save time), Mau is the perfect solution for you.

With Mau, provisioning and maintaining your infrastructure is as simple as clicking just a few buttons. Mau is designed to be simple and intuitive, so you can focus on building your applications and not worry about the underlying infrastructure. Under the hood, we use **Amazon Web Services** to provide you with a powerful and reliable platform, while abstracting away all the complexity of AWS. We take care of all the heavy lifting for you, so you can focus on building your applications and growing your business.

[Mau](https://mau.nestjs.com/ 'Deploy Nest') is perfect for startups, small-to-medium businesses, large enterprises, and developers who want to get up and running quickly without having to spend a lot of time on learning and managing infrastructure. It's incredibly easy to use, and you can have your infrastructure up and running in minutes. It also leverages AWS behind the scenes, giving you all the advantages of AWS without the hassle of managing its complexities.

<figure><img src="/assets/mau-metrics.png" /></figure>

With [Mau](https://mau.nestjs.com/ 'Deploy Nest'), you can:

- Deploy your NestJS applications with just a few clicks (APIs, microservices, etc.).
- Provision **databases** such as:
  - PostgreSQL
  - MySQL
  - MongoDB (DocumentDB)
  - Redis
  - more
- Set up broker services like:
  - RabbitMQ
  - Kafka
  - NATS
- Deploy scheduled tasks (**CRON jobs**) and background workers.
- Deploy lambda functions and serverless applications.
- Setup **CI/CD pipelines** for automated deployments.
- And much more!

To deploy your NestJS application with Mau, just run the following command:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

Sign up today and [Deploy with Mau](https://mau.nestjs.com/ 'Deploy Nest') to get your NestJS applications up and running on AWS in minutes!
