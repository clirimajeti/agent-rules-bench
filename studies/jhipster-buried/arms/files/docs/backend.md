# Backend conventions

These rules apply to all Java code in `src/main/java`.
The formatting itself is enforced by Prettier Java and Checkstyle; this file covers what the tools do not.

## General

- Java 21 features are welcome where they make code clearer: records for DTOs without behaviour, `switch` expressions, pattern matching for `instanceof`.
- Prefer `final` fields and constructor injection; never use field injection with `@Autowired`.
- Keep classes package-private when nothing outside the package needs them.
- Use `Optional` as a return type for lookups that may find nothing; never as a field or parameter type.
- Do not return `null` from collections-returning methods; return an empty list.
- Name boolean methods and fields as questions (`isActivated`, `hasAuthority`).
- Avoid static utility classes for logic that needs configuration; make it a bean.

## Services

- One service per aggregate (`UserService`, and for entities with business rules a dedicated service).
- Public service methods are the transaction boundary: annotate the class or method with `@Transactional`, and read-only methods with `@Transactional(readOnly = true)`.
- Services receive and return DTOs to the web layer; entities do not leave the service layer except in generated CRUD resources.
- Validate business rules in the service and throw a specific exception (for example `EmailAlreadyUsedException`); the web layer maps it to a problem response.
{{RULE_CLOCK}}
- Do not call other services' repositories directly; call the other service.
- Long-running work is moved to an `@Async` method or a scheduled job, never done inside a request transaction.
- Keep service methods small; extract private methods with descriptive names instead of comments.

## DTOs and mapping

- DTOs live in `service.dto` and end with `DTO` (`AdminUserDTO`, `UserDTO`).
- Use MapStruct mappers in `service.mapper`; hand-written mapping only when MapStruct cannot express it.
- DTOs carry Bean Validation annotations (`@NotNull`, `@Size`, `@Email`) that match the database constraints.
- Do not expose internal identifiers or audit fields in DTOs unless the client needs them.
- When a field is added to an entity, decide explicitly whether the DTO gets it.

## Logging

- Use a `private static final Logger LOG = LoggerFactory.getLogger(...)` per class.
- Log at `debug` for request-level detail, `info` for state changes worth keeping, `warn` for recoverable problems, `error` only with the exception.
- Use parameterised messages (`LOG.debug("Request to get User : {}", login)`), never string concatenation.
- Never log passwords, tokens, activation or reset keys, or full request bodies.
- The `CRLFLogConverter` strips line breaks from user input in logs; do not work around it.

## Errors

- REST errors are RFC 7807 problem details produced by `ExceptionTranslator`.
- Throw `BadRequestAlertException` for client errors that the UI should show with a translated message.
- Add a new error key to `ErrorConstants` and the i18n files when a new client-visible error is introduced.
- Do not catch `Exception` broadly; catch the specific exception you can handle.
- Never swallow an exception silently; at least log it with context.

## Concurrency

- Beans are singletons; they must not hold request-specific state in fields.
- Use the Spring-managed executor for asynchronous tasks.
- Optimistic locking is not used by default; add `@Version` to an entity only together with a decision and a migration.

## Performance

- Avoid N+1 queries: fetch associations with `@EntityGraph` or a dedicated query when a list view needs them.
- Page large result sets with `Pageable`; never return unbounded lists from a REST endpoint.
- Cache only data that changes rarely, and evict the cache in the service that changes it.

## Dependencies

- New Maven dependencies need a reason in the merge request description.
- Prefer what Spring Boot and JHipster already provide over adding a library.
- Do not change dependency versions managed by the JHipster BOM by hand.
