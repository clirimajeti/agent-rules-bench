# Security

Authentication uses stateless JWT; the token is issued by `AuthenticateController` and validated by the Spring Security resource server configuration in `SecurityJwtConfiguration`.

## Authentication

- Do not change token lifetimes in code; they come from `jhipster.security.authentication.jwt.*` properties.
- The JWT secret is configured per environment and never committed for production.
- Password hashing uses the `PasswordEncoder` bean (BCrypt); never hash passwords by hand.
- Account activation and password reset use random keys from `RandomUtil`; never build keys from user data.

## Authorization

- URL-level rules live in `SecurityConfiguration`; keep the most specific matchers first.
- `/api/admin/**` is restricted to administrators at URL level, and admin resources also carry a method-level check so moving a method does not open it up.
- Method-level checks use `@PreAuthorize` on resource methods.
{{RULE_AUTHORITIES}}
- Use `SecurityUtils` to read the current user's login or authorities; do not read the `SecurityContextHolder` directly in services.
- A user may only read and change their own data unless they are an administrator; check ownership in the service.
- New authorities are added to the `jhi_authority` table with a Liquibase changelog.

## Input handling

- Validate all input with Bean Validation at the resource boundary.
- Never build JPQL or SQL by string concatenation with user input; use parameters.
- Escape or reject user input that ends up in emails or logs; the mail templates escape by default.

## Secrets

- Secrets come from environment variables or the deployment's secret store, never from committed files.
- Do not log secrets, tokens or keys, not even partially.
- Test secrets in `src/test/resources` are fake and must stay fake.

## Headers and CORS

- Security headers (CSP, frame options, referrer policy) are set in `SecurityConfiguration`; change them only together with the frontend.
- CORS is open only in the `dev` profile; production serves client and API from the same origin.

## Dependencies and scanning

- Dependabot and the JHipster upgrade process keep dependencies current; do not pin around a security update without a note.
- Findings from the dependency scan are fixed or explicitly accepted in the merge request.
