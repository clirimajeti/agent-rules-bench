# Database

PostgreSQL in all environments, accessed through SQLModel (SQLAlchemy 2 underneath).

## Tables

- Table models live in `app/models.py` with `table=True`.
- Primary keys are `uuid.UUID` with `default_factory=uuid.uuid4`.
- Foreign keys declare `ondelete="CASCADE"` where child rows must not outlive their parent, as items do for users.
- Relationships use `Relationship(back_populates=...)` on both sides.
- Every table has `created_at` set by `get_datetime_utc`.

## Sessions

- The request-scoped session comes from the `SessionDep` dependency; never create an engine or session in application code.
- Scripts and startup code use `with Session(engine) as session:`.
- Load only what you need: select columns or use `func.count()` for counts instead of loading all rows.
- Use `select(...)` statements with `session.exec`; avoid raw SQL.

## Migrations

- Every schema change gets an Alembic revision: `alembic revision --autogenerate -m "..."`, then review the generated file.
- Never edit a revision that has been merged; add a new one.
- Migrations must run on an empty database and on the current production schema.
- Data migrations are separate revisions from schema migrations.

## Queries

- Filter in the database, not in Python.
- Use parameters for all values; never format values into SQL strings.
- Add an index in the same merge request as a new query that filters or orders on an unindexed column.
- Deleting many rows uses a single `delete(...)` statement instead of a loop.

## Data protection

- Personal data (emails, names) is stored only where needed and deleted with the user.
- Do not copy personal data into new tables without a reason in the merge request.
