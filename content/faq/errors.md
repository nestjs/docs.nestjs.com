### Common errors

During your development with NestJS, you may encounter various errors as you learn the framework.

#### "Cannot resolve dependency" error

Probably the most common error message is about Nest not being able to resolve dependencies of a provider. The error message usually looks something like this:

```bash
Nest can't resolve dependencies of the <provider> (?). Please make sure that the argument <unknown_token> at index [<index>] is available in the <module> context.

Potential solutions:
- If <unknown_token> is a provider, is it part of the current <module>?
- If <unknown_token> is exported from a separate @Module, is that module imported within <module>?
  @Module({
    imports: [ /* the Module containing <unknown_token> */ ]
  })
```


The most common culprit of the error, is not having the `provider` in the module's `providers` array. Please make sure that the provider is indeed in the `providers` array and following [standard NestJS provider practices](/fundamentals/custom-providers#di-fundamentals).

There are a few gotchas, that are common. One is putting a provider in an `imports` array. If this is the case, the error will have the provider's name where `<module>` should be.

If you run across this error while developing, take a look at the module mentioned in the error message and look at its `providers`. For each provider in the `providers` array, make sure the module has access to all of the dependencies. Often times, `providers` are duplicated in a "Feature Module" and a "Root Module" which means Nest will try to instantiate the provider twice. More than likely, the module containing the `provider` being duplicated should be added in the "Root Module"'s `imports` array instead.

If the `unknown_token` above is the string `dependency`, you might have a circular file import. This is different from the [circular dependency](./errors.md#circular-dependency-error) below because instead of  having providers depend on each other in their constructors, it just means that two files end up importing each other. A common case would be a module file declaring a token and importing a provider, and the provider import the token constant from the module file. If you are using barrel files, ensure that your barrel imports do not end up creating these circular imports as well.

#### "Circular dependency" error

Occasionally you'll find it difficult to avoid [circular dependencies](/fundamentals/circular-dependency) in your application. You'll need to take some steps to help Nest resolve these. Errors that arise from circular dependencies look like this:

```bash
Nest cannot create the <module> instance.
The module at index [<index>] of the <module> "imports" array is undefined.

Potential causes:
- A circular dependency between modules. Use forwardRef() to avoid it. Read more: https://docs.nestjs.com/fundamentals/circular-dependency
- The module at index [<index>] is of type "undefined". Check your import statements and the type of the module.

Scope [<module_import_chain>]
# example chain AppModule -> FooModule
```

Circular dependencies can arise from both providers depending on each other, or typescript files depending on each other for constants, such as exporting constants from a module file and importing them in a service file. In the latter case, it is advised to create a separate file for your constants. In the former case, please follow the guide on circular dependencies and make sure that both the modules **and** the providers are marked with `forwardRef`.

#### Debugging dependency errors

Along with just manually verifying your dependencies are correct, as of Nest 8.1.0 you can set the `NEST_DEBUG` environment variable to a string that resolves as truthy, and get extra logging information while Nest is resolving all of the dependencies for the application. 

<figure><img src="/assets/injector_logs.png" /></figure>

In the above image, the string in yellow is the host class of the dependency being injected, the string in blue is the name of the injected dependency, or its injection token, and the string in purple is the module in which the dependency is being searched for. Using this, you can usually trace back the dependency resolution for what's happening and why you're getting dependency injection problems.
