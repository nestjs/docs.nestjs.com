### Common Errors

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

There are a few gotchas, that are common. One is putting a provider in an `imports` array. If this is the case, the error will have the provider's name where `<module>` should be.

#### Circular Dependency

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

Circular dependencies can arise from both providers depending on each other, or typescript files depending on each other for constants, such as exporting constants from a module file and importing them in a service file. In the latter case, it is advised to create a separate file for your constants. In the former case, please follow the guide on ciruclar dependencies and make sure that both the modules **and** the providers are marked with `forwardRef`.
